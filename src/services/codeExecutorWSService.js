import WebSocket from 'ws';
import containerManager, { READINESS } from './containerManager.js';
import fallbackCodeExecutor from './fallbackCodeExecutor.js';
import pistonCodeExecutor from './pistonCodeExecutor.js';

// CODE_EXEC_BACKEND: "docker" (default) | "piston" | "fallback"
const BACKEND = (process.env.CODE_EXEC_BACKEND || 'docker').toLowerCase();

// Only meaningful when PISTON_URL points at a self-hosted instance. The public
// endpoint has been whitelist-only since 2026-02-15 and answers 401, so
// falling through to it by default produced a confusing error rather than a
// working execution.
const PISTON_IS_SELF_HOSTED = Boolean(process.env.PISTON_URL);

class CodeExecutorWSService {
  constructor() {
    this.wsConnections = {
      python: null,
      javascript: null,
      cpp: null
    };
    this.dockerAvailable = null; // Cache Docker availability check
    this.dockerCheckTime = 0;
  }

  /**
   * Get or create WebSocket connection to a container
   */
  /** One connection attempt. Resolves on open, rejects on error or timeout. */
  #connectOnce(language, port) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { ws.terminate(); } catch { /* already gone */ }
          reject(new Error(`Timeout connecting to ${language} executor`));
        }
      }, 5000);

      ws.on('open', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.log(`WebSocket connected to ${language} executor`);
        this.wsConnections[language] = ws;
        resolve(ws);
      });

      ws.on('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });

      ws.on('close', () => {
        console.log(`WebSocket disconnected from ${language} executor`);
        this.wsConnections[language] = null;
      });
    });
  }

  /**
   * Connection to a language's executor, reusing an open one.
   *
   * A freshly created container reports "running" and even "healthy" before the
   * WebSocket server inside it is listening, so a single immediate attempt gets
   * ECONNRESET on a container that is about to be perfectly fine. Retries with
   * a short backoff and re-reads the port each time, since a recreated
   * container is published on a different random host port.
   */
  async getConnection(language, { attempts = 5 } = {}) {
    const existing = this.wsConnections[language];
    if (existing && existing.readyState === WebSocket.OPEN) return existing;

    let lastError;
    for (let i = 0; i < attempts; i++) {
      try {
        const port = await containerManager.getContainerPort(language);
        return await this.#connectOnce(language, port);
      } catch (err) {
        lastError = err;
        if (i < attempts - 1) {
          // 0.5s, 1s, 1.5s, 2s — about 5s total, comfortably covering the
          // startup gap without stalling a genuinely broken container.
          await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        }
      }
    }

    console.error(
      `Could not connect to ${language} executor after ${attempts} attempts: ${lastError?.message}`
    );
    throw lastError ?? new Error(`Could not connect to ${language} executor`);
  }

  /**
   * Execute code in a container or fallback to simple execution
   */
  async executeCode(code, language, input = '') {
    // Production / non-Docker hosts: route to Piston or in-process fallback
    if (BACKEND === 'piston') {
      return pistonCodeExecutor.executeCode(code, language, input);
    }
    if (BACKEND === 'fallback') {
      return fallbackCodeExecutor.executeCode(code, language, input);
    }

    // Report a warming-up sandbox honestly instead of falling through to a
    // fallback that will fail with an unrelated error.
    const readiness = await containerManager.refreshReadiness(language);
    if (readiness === READINESS.STARTING) {
      return {
        output:
          `The ${language} execution environment is still starting up. ` +
          `This takes up to a couple of minutes after a deploy. Please try again shortly.`,
        error: true,
        warmingUp: true,
        executorUnavailable: true,
        executionTime: '0ms'
      };
    }

    try {
      // Docker attempt, with one retry against a freshly-resolved container.
      //
      // Containers publish on a random host port, so recreating one moves it.
      // A cached socket then fails with ECONNRESET even though the container is
      // healthy. Retrying blindly would hit the same stale port, so the cached
      // connection and container handle are both discarded first.
      const attempt = () => {
        const dockerPromise = this.executeViaDocker(code, language, input);
        const timeoutPromise = new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('Docker timeout')), 30000)
        );
        return Promise.race([dockerPromise, timeoutPromise]);
      };

      try {
        return await attempt();
      } catch (firstError) {
        const msg = String(firstError?.message ?? firstError);
        const looksStale = /ECONNRESET|ECONNREFUSED|socket hang up|not found|no published port/i.test(msg);

        if (looksStale) {
          console.log(`⚠️  Executor connection stale (${msg}); re-resolving ${language}`);
          try {
            this.wsConnections[language]?.terminate?.();
          } catch { /* already gone */ }
          this.wsConnections[language] = null;
          await containerManager.refreshContainer(language);

          try {
            return await attempt();
          } catch (secondError) {
            console.log(`⚠️  Docker execution failed after refresh (${secondError.message})`);
          }
        } else {
          console.log(`⚠️  Docker execution failed (${msg})`);
        }

        // Only try Piston when it can actually serve us. The public instance
        // returns 401, which previously surfaced to the user as the error.
        if (PISTON_IS_SELF_HOSTED) {
          const result = await pistonCodeExecutor.executeCode(code, language, input);
          if (!result.error) return result;
          console.log('⚠️  Piston execution failed, trying in-process fallback');
        }

        return await fallbackCodeExecutor.executeCode(code, language, input);
      }

    } catch (error) {
      return {
        output: `Execution error: ${error.message}`,
        error: true,
        executionTime: 'Failed'
      };
    }
  }

  /**
   * Execute code via Docker (original implementation)
   */
  async executeViaDocker(code, language, input = '') {
    // Ensure container is running
    const isRunning = await containerManager.isContainerRunning(language);
    if (!isRunning) {
      await containerManager.startContainer(language);
    }

    // Get WebSocket connection
    const ws = await this.getConnection(language);

    // Send code execution request
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject({
          output: 'Error: Code execution timed out (30 second limit)',
          error: true,
          executionTime: 'Timeout (>30s)'
        });
      }, 30000);

      // Handle messages from executor
      const messageHandler = (data) => {
        try {
          const result = JSON.parse(data.toString());
          
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          ws.off('error', errorHandler);
          
          // If there's an error, combine output and error fields
          const outputText = result.status === 'error' 
            ? (result.error || result.output || 'Unknown error occurred')
            : (result.output || 'No output');
          
          resolve({
            output: outputText,
            error: result.status === 'error',
            executionTime: 'N/A'
          });
        } catch (error) {
          clearTimeout(timeoutId);
          ws.off('message', messageHandler);
          ws.off('error', errorHandler);
          
          reject({
            output: `Error parsing response: ${error.message}`,
            error: true,
            executionTime: 'Failed'
          });
        }
      };

      const errorHandler = (error) => {
        clearTimeout(timeoutId);
        ws.off('message', messageHandler);
        ws.off('error', errorHandler);
        
        reject({
          output: `WebSocket error: ${error.message}`,
          error: true,
          executionTime: 'Failed'
        });
      };

      ws.on('message', messageHandler);
      ws.on('error', errorHandler);

      // Send the code execution request
      ws.send(JSON.stringify({
        code,
        input
      }));
    });
  }

  /**
   * Close all WebSocket connections
   */
  closeAllConnections() {
    Object.keys(this.wsConnections).forEach(language => {
      if (this.wsConnections[language]) {
        this.wsConnections[language].close();
        this.wsConnections[language] = null;
      }
    });
  }
}

const codeExecutorWSService = new CodeExecutorWSService();
export default codeExecutorWSService;

