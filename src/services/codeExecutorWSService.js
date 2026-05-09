import WebSocket from 'ws';
import containerManager from './containerManager.js';
import fallbackCodeExecutor from './fallbackCodeExecutor.js';

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
    try {
      // Try Docker first (with timeout)
      const dockerTimeout = 3000; // 3 second timeout for Docker attempt
      const dockerPromise = this.executeViaDocker(code, language, input);
      const timeoutPromise = new Promise((resolve, reject) => 
        setTimeout(() => reject(new Error('Docker timeout')), dockerTimeout)
      );

      try {
        // If Docker succeeds within timeout, use it
        return await Promise.race([dockerPromise, timeoutPromise]);
      } catch (dockerError) {
        // Docker failed or timed out, fall back to simple executor
        console.log(`⚠️  Docker execution failed (${dockerError.message}), using fallback executor`);
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

