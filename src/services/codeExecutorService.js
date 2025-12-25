import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CodeExecutorService {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.dockerDir = path.join(process.cwd(), 'docker');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async executeCode(code, language, input = '') {
    const sessionId = this.generateSessionId();
    const sessionDir = path.join(this.tempDir, sessionId);
    
    try {
      await fs.mkdir(sessionDir, { recursive: true });
      
      const result = await this.runInDocker(code, language, sessionDir, input);
      
      await this.cleanup(sessionDir);
      
      return result;
    } catch (error) {
      await this.cleanup(sessionDir);
      throw error;
    }
  }

  async runInDocker(code, language, sessionDir, input) {
    const { filename, dockerfile } = this.getLanguageConfig(language);
    const filePath = path.join(sessionDir, filename);
    
    await fs.writeFile(filePath, code);
    
    if (input) {
      await fs.writeFile(path.join(sessionDir, 'input.txt'), input);
    }

    const dockerfilePath = path.join(this.dockerDir, dockerfile);
    const imageName = `learncodeai-${language}-${Date.now()}`;
    const containerName = `learncodeai-container-${Date.now()}`;

    try {
      // Build the Docker image
      await execAsync(`docker build -t ${imageName} -f ${dockerfilePath} ${sessionDir}`, {
        timeout: 30000
      });

      // Prepare the run command
      const runCommand = input 
        ? `docker run --rm --name ${containerName} --memory=128m --cpus=0.5 --network=none ${imageName} < ${path.join(sessionDir, 'input.txt')}`
        : `docker run --rm --name ${containerName} --memory=128m --cpus=0.5 --network=none ${imageName}`;

      // Execute with timeout and proper error handling
      const startTime = Date.now();
      
      try {
        const { stdout, stderr } = await execAsync(runCommand, {
          timeout: 10000,
          maxBuffer: 1024 * 1024
        });

        const executionTime = Date.now() - startTime;

        await execAsync(`docker rmi ${imageName}`).catch(() => {});

        return {
          output: stdout || stderr || 'No output',
          error: stderr ? true : false,
          executionTime: `${executionTime}ms`
        };

      } catch (execError) {
        // Try to stop and remove the container if it's still running
        await execAsync(`docker stop ${containerName}`).catch(() => {});
        await execAsync(`docker rm ${containerName}`).catch(() => {});
        
        throw execError;
      }

    } catch (error) {
      // Clean up the image
      await execAsync(`docker rmi ${imageName}`).catch(() => {});
      
      if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
        return {
          output: 'Error: Code execution timed out (10 second limit). Your code may have an infinite loop or is taking too long to execute.',
          error: true,
          executionTime: 'Timeout (>10s)'
        };
      }
      
      return {
        output: `Execution Error: ${error.message}`,
        error: true,
        executionTime: 'Failed'
      };
    }
  }

  getLanguageConfig(language) {
    const configs = {
      python: { filename: 'main.py', dockerfile: 'Dockerfile.python' },
      cpp: { filename: 'main.cpp', dockerfile: 'Dockerfile.cpp' },
      javascript: { filename: 'main.js', dockerfile: 'Dockerfile.javascript' }
    };

    if (!configs[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return configs[language];
  }

  isLanguageSupported(language) {
    const supportedLanguages = ['python', 'cpp', 'javascript'];
    return supportedLanguages.includes(language);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanup(sessionDir) {
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

const codeExecutorService = new CodeExecutorService();
export { CodeExecutorService };
export default codeExecutorService;

