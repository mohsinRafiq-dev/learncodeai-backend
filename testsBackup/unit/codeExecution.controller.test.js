import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import codeExecutionController from '../../src/controllers/codeExecutionController.js';
import codeExecutorService from '../../src/services/codeExecutorService.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

describe('Code Execution Controller Tests', () => {
  let app;
  let executeCodeSpy;

  beforeEach(() => {
    app = createTestApp();
    
    // Mock code executor service methods
    executeCodeSpy = jest.spyOn(codeExecutorService, 'executeCode').mockResolvedValue({
      output: 'Hello, World!',
      executionTime: 100,
      memoryUsage: 50,
    });
    
    jest.clearAllMocks();
  });

  describe('Execute Code', () => {
    test('should execute Python code successfully', async () => {
      const mockResult = {
        output: 'Hello, World!',
        executionTime: 100,
        memoryUsage: 50,
      };

      executeCodeSpy.mockResolvedValue(mockResult);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'print("Hello, World!")',
          language: 'python',
          input: '',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(executeCodeSpy).toHaveBeenCalledWith(
        'print("Hello, World!")',
        'python',
        ''
      );
    });

    test('should execute JavaScript code successfully', async () => {
      const mockResult = {
        output: 'Hello, World!',
        executionTime: 80,
        memoryUsage: 40,
      };

      executeCodeSpy.mockResolvedValue(mockResult);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'console.log("Hello, World!");',
          language: 'javascript',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    test('should execute C++ code successfully', async () => {
      const mockResult = {
        output: 'Hello, World!',
        executionTime: 200,
        memoryUsage: 60,
      };

      executeCodeSpy.mockResolvedValue(mockResult);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: '#include <iostream>\nusing namespace std;\nint main() { cout << "Hello, World!" << endl; return 0; }',
          language: 'cpp',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    test('should handle code with input', async () => {
      const mockResult = {
        output: 'Input received: John',
        executionTime: 120,
        memoryUsage: 45,
      };

      executeCodeSpy.mockResolvedValue(mockResult);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'name = input("Enter name: ")\\nprint(f"Input received: {name}")',
          language: 'python',
          input: 'John',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(executeCodeSpy).toHaveBeenCalledWith(
        'name = input("Enter name: ")\\nprint(f"Input received: {name}")',
        'python',
        'John'
      );
    });

    test('should reject request without code', async () => {
      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          language: 'python',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code and language are required');
    });

    test('should reject request without language', async () => {
      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'print("Hello")',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code and language are required');
    });

    test('should reject unsupported language', async () => {
      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'puts "Hello"',
          language: 'ruby',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unsupported language. Supported: python, cpp, javascript');
    });

    test('should handle execution service errors', async () => {
      const mockError = new Error('Docker container failed');
      executeCodeSpy.mockRejectedValue(mockError);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'print("Hello")',
          language: 'python',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code execution failed');
      expect(response.body.error).toBe('Docker container failed');
    });

    test('should handle timeout errors', async () => {
      const mockError = new Error('Execution timeout');
      executeCodeSpy.mockRejectedValue(mockError);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: 'while True: pass',  // Infinite loop
          language: 'python',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code execution failed');
    });
  });

  describe('Get Languages', () => {
    test('should return supported languages', async () => {
      app.get('/languages', codeExecutionController.getLanguages);

      const response = await request(app)
        .get('/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data).toEqual([
        { id: 'python', name: 'Python', version: '3.11' },
        { id: 'cpp', name: 'C++', version: 'GCC Latest' },
        { id: 'javascript', name: 'JavaScript', version: 'Node.js 18' }
      ]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty code', async () => {
      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: '',
          language: 'python',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code and language are required');
    });

    test('should handle malformed JSON', async () => {
      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send('invalid json')
        .expect(500);

      expect(response.status).toBe(500);
    });

    test('should handle very long code input', async () => {
      const longCode = 'print("Hello")\\n'.repeat(1000);
      const mockResult = {
        output: 'Hello\\n'.repeat(1000).trim(),
        executionTime: 150,
        memoryUsage: 80,
      };

      executeCodeSpy.mockResolvedValue(mockResult);

      app.post('/execute', codeExecutionController.executeCode);

      const response = await request(app)
        .post('/execute')
        .send({
          code: longCode,
          language: 'python',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
