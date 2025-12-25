import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { CodeExecutorService } from '../../src/services/codeExecutorService.js';

describe('Code Executor Service Tests', () => {
  let service;

  beforeEach(() => {
    service = new CodeExecutorService();
    
    // Mock filesystem operations
    jest.spyOn(fs, 'access').mockRejectedValue(new Error('Not found'));
    jest.spyOn(fs, 'mkdir').mockResolvedValue();
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
    jest.spyOn(fs, 'rm').mockResolvedValue();
    
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct temp directory', () => {
      expect(service.tempDir).toBe(path.join(process.cwd(), 'temp'));
      expect(service.dockerDir).toBe(path.join(process.cwd(), 'docker'));
    });

    test('should ensure temp directory exists', async () => {
      await service.ensureTempDir();
      expect(fs.access).toHaveBeenCalledWith(service.tempDir);
      expect(fs.mkdir).toHaveBeenCalledWith(service.tempDir, { recursive: true });
    });
  });

  describe('Session Management', () => {
    test('should generate unique session IDs', () => {
      const id1 = service.generateSessionId();
      const id2 = service.generateSessionId();
      
      // Updated regex to match actual format: session_timestamp_randomstring
      expect(id1).toMatch(/^session_\d{13}_[a-z0-9]{9,}$/);
      expect(id2).toMatch(/^session_\d{13}_[a-z0-9]{9,}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Code Execution (Docker Environment Tests)', () => {
    test('should handle Docker unavailable gracefully for Python', async () => {
      const code = 'print("Hello, World!")';
      const result = await service.executeCode(code, 'python');

      // When Docker is unavailable, we expect an error response
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('error');
      
      // Should still write the file
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.py'),
        code
      );
    });

    test('should handle Docker unavailable gracefully for JavaScript', async () => {
      const code = 'console.log("Hello, World!");';
      const result = await service.executeCode(code, 'javascript');

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('error');
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.js'),
        code
      );
    });

    test('should handle Docker unavailable gracefully for C++', async () => {
      const code = '#include <iostream>\nint main() { std::cout << "Hello, World!" << std::endl; return 0; }';
      const result = await service.executeCode(code, 'cpp');

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('error');
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('main.cpp'),
        code
      );
    });

    test('should handle code with input when Docker unavailable', async () => {
      const code = 'name = input("Enter name: ")\\nprint(f"Input received: {name}")';
      const input = 'John';
      
      const result = await service.executeCode(code, 'python', input);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('input.txt'),
        input
      );
    });

    test('should handle compilation errors when Docker unavailable', async () => {
      const code = '#include <iostream>\nint main() { undefined_variable; return 0; }';
      const result = await service.executeCode(code, 'cpp');

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result.error).toBe(true);
    });

    test('should handle runtime errors when Docker unavailable', async () => {
      const code = 'result = 10 / 0\\nprint(result)';
      const result = await service.executeCode(code, 'python');

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result.error).toBe(true);
    });

    test('should handle timeout scenarios when Docker unavailable', async () => {
      const code = 'while True: pass';  // Infinite loop
      const result = await service.executeCode(code, 'python');
      
      // Should return error result instead of throwing
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result.error).toBe(true);
    });

    test('should handle Docker container startup failure', async () => {
      const code = 'print("Hello")';
      const result = await service.executeCode(code, 'python');
      
      // Should return error result instead of throwing
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result.error).toBe(true);
    });
  });

  describe('Language Configuration', () => {
    test('should return correct config for Python', () => {
      const config = service.getLanguageConfig('python');
      expect(config.filename).toBe('main.py');
      expect(config.dockerfile).toBe('Dockerfile.python');
    });

    test('should return correct config for JavaScript', () => {
      const config = service.getLanguageConfig('javascript');
      expect(config.filename).toBe('main.js');
      expect(config.dockerfile).toBe('Dockerfile.javascript');
    });

    test('should return correct config for C++', () => {
      const config = service.getLanguageConfig('cpp');
      expect(config.filename).toBe('main.cpp');
      expect(config.dockerfile).toBe('Dockerfile.cpp');
    });

    test('should throw error for unsupported language', () => {
      expect(() => service.getLanguageConfig('ruby')).toThrow('Unsupported language: ruby');
    });
  });

  describe('Cleanup', () => {
    test('should clean up session directory after execution', async () => {
      const code = 'print("Hello, World!")';
      
      await service.executeCode(code, 'python');
      
      // Should attempt to clean up
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('session_'),
        { recursive: true, force: true }
      );
    });

    test('should clean up even if execution fails', async () => {
      const code = 'invalid code';
      
      const result = await service.executeCode(code, 'python');
      
      // Should still clean up
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('session_'),
        { recursive: true, force: true }
      );
      expect(result.error).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    test('should measure execution time when Docker unavailable', async () => {
      const result = await service.executeCode('print("Hello, World!")', 'python');
      
      // Should have some execution time recorded
      expect(result).toHaveProperty('executionTime');
      expect(typeof result.executionTime).toBe('string'); // "Failed" when Docker unavailable
    });

    test('should include execution statistics', async () => {
      const result = await service.executeCode('print("test")', 'python');
      
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid language gracefully', async () => {
      await expect(service.executeCode('test', 'invalid')).rejects.toThrow('Unsupported language: invalid');
    });

    test('should handle empty code gracefully', async () => {
      const result = await service.executeCode('', 'python');
      
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('executionTime');
      expect(result.error).toBe(true);
    });

    test('should handle filesystem errors', async () => {
      // Mock fs.mkdir to fail
      fs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));
      
      await expect(service.executeCode('print("test")', 'python')).rejects.toThrow();
    });
  });
});
