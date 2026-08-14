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
  async getConnection(language) {
    // Check if we have an existing valid connection
    if (this.wsConnections[language] && this.wsConnections[language].readyState === WebSocket.OPEN) {
      return this.wsConnections[language];
    }

    // Create new connection
    const port = await containerManager.getContainerPort(language);
    const wsUrl = `ws://localhost:${port}`;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`WebSocket connected to ${language} executor`);
        this.wsConnections[language] = ws;
        resolve(ws);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${language}:`, error.message);
        reject(error);
      });

      ws.on('close', () => {
        console.log(`WebSocket disconnected from ${language} executor`);
        this.wsConnections[language] = null;
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error(`Timeout connecting to ${language} executor`));
        }
      }, 5000);
    });
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
      // Try Docker first (with timeout)
      const dockerTimeout = 3000; // 3 second timeout for Docker attempt
      const dockerPromise = this.executeViaDocker(code, language, input);
      const timeoutPromise = new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error('Docker timeout')), dockerTimeout)
      );

      try {
        return await Promise.race([dockerPromise, timeoutPromise]);
      } catch (dockerError) {
        console.log(`⚠️  Docker execution failed (${dockerError.message})`);

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

