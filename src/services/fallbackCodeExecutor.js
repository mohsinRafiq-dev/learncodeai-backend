import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fallback code executor for when Docker is not available
 * Uses child_process to execute code safely with timeouts
 */
class FallbackCodeExecutor {
  constructor() {
    this.tempDir = path.join(__dirname, '..', '..', 'temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Execute code with timeout and error handling
   */
  async executeCode(code, language, input = '') {
    const startTime = Date.now();
    
    try {
      let command;
      let tempFile;

      switch (language.toLowerCase()) {
        case 'python':
          return await this.executePython(code, input);
        
        case 'javascript':
        case 'js':
          return await this.executeJavaScript(code, input);
        
        case 'cpp':
        case 'c++':
          return {
            output: '⚠️  C++ execution requires Docker. Please ensure Docker Desktop is running.',
            error: true,
            executionTime: '0ms'
          };
        
        default:
          return {
            output: `❌ Unsupported language: ${language}`,
            error: true,
            executionTime: '0ms'
          };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        output: `Error: ${error.message}`,
        error: true,
        executionTime: `${executionTime}ms`
      };
    }
  }

  /**
   * Execute Python code
   */
  async executePython(code, input = '') {
    const startTime = Date.now();
    const tempFile = path.join(this.tempDir, `py_${Date.now()}.py`);

    try {
      // Write code to temp file
      fs.writeFileSync(tempFile, code);

      // Execute with 10 second timeout
      const { stdout, stderr } = await execAsync(`python "${tempFile}"`, {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      const executionTime = Date.now() - startTime;

      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      return {
        output: stdout || '(No output)',
        error: false,
        executionTime: `${executionTime}ms`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      let errorMsg = error.message;
      if (error.killed) {
        errorMsg = 'Execution timeout (10 seconds exceeded)';
      } else if (error.stderr) {
        errorMsg = error.stderr;
      }

      return {
        output: `Error: ${errorMsg}`,
        error: true,
        executionTime: `${executionTime}ms`
      };
    }
  }

  /**
   * Execute JavaScript code using Node.js
   */
  async executeJavaScript(code, input = '') {
    const startTime = Date.now();
    const tempFile = path.join(this.tempDir, `js_${Date.now()}.js`);

    try {
      // Wrap code to capture output
      const wrappedCode = `
        const originalLog = console.log;
        const originalError = console.error;
        let output = '';
        
        console.log = function(...args) {
          output += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') + '\\n';
          originalLog(...args);
        };
        
        console.error = function(...args) {
          output += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ') + '\\n';
          originalError(...args);
        };

        try {
          ${code}
        } catch(err) {
          output += 'Error: ' + err.message + '\\n';
        }
        
        console.log(output);
      `;

      fs.writeFileSync(tempFile, wrappedCode);

      // Execute with 10 second timeout
      const { stdout, stderr } = await execAsync(`node "${tempFile}"`, {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024
      });

      const executionTime = Date.now() - startTime;

      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      return {
        output: stdout || '(No output)',
        error: false,
        executionTime: `${executionTime}ms`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      let errorMsg = error.message;
      if (error.killed) {
        errorMsg = 'Execution timeout (10 seconds exceeded)';
      } else if (error.stderr) {
        errorMsg = error.stderr;
      }

      return {
        output: `Error: ${errorMsg}`,
        error: true,
        executionTime: `${executionTime}ms`
      };
    }
  }

  /**
   * Clean up old temp files (older than 1 hour)
   */
  cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > oneHour) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned up temp file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up temp files:', error.message);
    }
  }
}

export default new FallbackCodeExecutor();
