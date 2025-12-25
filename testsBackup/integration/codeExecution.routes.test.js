import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import codeExecutionRoutes from '../../src/routes/codeExecutionRoutes.js';

import codeExecutorService from '../../src/services/codeExecutorService.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api/code', codeExecutionRoutes);
  
  // Error handling middleware
  app.use((err, req, res) => {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  });
  
  return app;
};

describe('Code Execution Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock codeExecutorService
    jest.spyOn(codeExecutorService, 'executeCode').mockResolvedValue({
      output: 'Mock output',
      executionTime: 100,
      memoryUsage: 50,
    });
  });

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/code/execute', () => {
    test('should execute Python code successfully', async () => {
      const mockResult = {
        output: 'Hello, World!\\nPython is awesome!',
        executionTime: 150,
        memoryUsage: 45,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: 'print("Hello, World!")\\nprint("Python is awesome!")',
        language: 'python',
        input: '',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(codeExecutorService.executeCode).toHaveBeenCalledWith(
        codeData.code,
        codeData.language,
        codeData.input
      );
    });

    test('should execute JavaScript code with complex logic', async () => {
      const mockResult = {
        output: '1\\n1\\n2\\n3\\n5\\n8\\n13\\n21\\n34\\n55',
        executionTime: 120,
        memoryUsage: 38,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: `
          function fibonacci(n) {
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
          }
          
          for (let i = 0; i < 10; i++) {
            console.log(fibonacci(i));
          }
        `,
        language: 'javascript',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toBe(mockResult.output);
      expect(response.body.data.executionTime).toBe(mockResult.executionTime);
    });

    test('should execute C++ code with input/output', async () => {
      const mockResult = {
        output: 'Enter your name: Hello, John!\\nNice to meet you.',
        executionTime: 200,
        memoryUsage: 52,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: `
          #include <iostream>
          #include <string>
          using namespace std;
          
          int main() {
            string name;
            cout << "Enter your name: ";
            cin >> name;
            cout << "Hello, " << name << "!" << endl;
            cout << "Nice to meet you." << endl;
            return 0;
          }
        `,
        language: 'cpp',
        input: 'John',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    test('should handle code execution with multiple inputs', async () => {
      const mockResult = {
        output: 'Sum: 15\\nProduct: 50',
        executionTime: 95,
        memoryUsage: 40,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: `
          a = int(input())
          b = int(input())
          print(f"Sum: {a + b}")
          print(f"Product: {a * b}")
        `,
        language: 'python',
        input: '5\\n10',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toBe(mockResult.output);
    });

    test('should handle syntax errors', async () => {
      const mockResult = {
        output: 'SyntaxError: invalid syntax\\n  File "main.py", line 1\\n    print("Hello World"\\n                      ^\\nSyntaxError: EOL while scanning string literal',
        executionTime: 50,
        memoryUsage: 35,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: 'print("Hello World"',  // Missing closing quote
        language: 'python',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('SyntaxError');
    });

    test('should handle runtime errors', async () => {
      const mockResult = {
        output: 'Traceback (most recent call last):\\n  File "main.py", line 1, in <module>\\n    print(10 / 0)\\nZeroDivisionError: division by zero',
        executionTime: 75,
        memoryUsage: 42,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: 'print(10 / 0)',
        language: 'python',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('ZeroDivisionError');
    });

    test('should handle compilation errors for C++', async () => {
      const mockResult = {
        output: "main.cpp: In function 'int main()': main.cpp:4:5: error: 'undeclaredVariable' was not declared in this scope",
        executionTime: 180,
        memoryUsage: 48,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const codeData = {
        code: `
          #include <iostream>
          int main() {
            undeclaredVariable = 5;
            return 0;
          }
        `,
        language: 'cpp',
      };

      const response = await request(app)
        .post('/api/code/execute')
        .send(codeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('error');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({ language: 'python' })  // Missing code
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code and language are required');
    });

    test('should validate supported languages', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'puts "Hello World"',
          language: 'ruby',  // Unsupported language
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unsupported language. Supported: python, cpp, javascript');
    });

    test('should handle service execution errors', async () => {
      const mockError = new Error('Docker execution failed');
      codeExecutorService.executeCode.mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print("Hello")',
          language: 'python',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code execution failed');
      expect(response.body.error).toBe('Docker execution failed');
    });

    test('should handle timeout errors', async () => {
      const mockError = new Error('Execution timed out after 10 seconds');
      codeExecutorService.executeCode.mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'while True: pass',  // Infinite loop
          language: 'python',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code execution failed');
      expect(response.body.error).toBe('Execution timed out after 10 seconds');
    });

    test('should handle large code input', async () => {
      const mockResult = {
        output: 'Large code executed successfully',
        executionTime: 300,
        memoryUsage: 80,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const largeCode = Array(500).fill(0).map((_, i) => `print("Line ${i}")`).join('\\n');
      
      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: largeCode,
          language: 'python',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/code/languages', () => {
    test('should return supported languages list', async () => {
      const response = await request(app)
        .get('/api/code/languages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      const languages = response.body.data;
      expect(languages).toEqual([
        { id: 'python', name: 'Python', version: '3.11' },
        { id: 'cpp', name: 'C++', version: 'GCC Latest' },
        { id: 'javascript', name: 'JavaScript', version: 'Node.js 18' }
      ]);
    });

    test('should return languages with correct structure', async () => {
      const response = await request(app)
        .get('/api/code/languages')
        .expect(200);

      const languages = response.body.data;
      
      languages.forEach(language => {
        expect(language).toHaveProperty('id');
        expect(language).toHaveProperty('name');
        expect(language).toHaveProperty('version');
        expect(typeof language.id).toBe('string');
        expect(typeof language.name).toBe('string');
        expect(typeof language.version).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')  // Invalid JSON
        .expect(400);

      expect(response.status).toBe(400);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Code and language are required');
    });

    test('should handle URL-encoded form data', async () => {
      const response = await request(app)
        .post('/api/code/execute')
        .send('code=print("hello")&language=python')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Performance and Limits', () => {
    test('should handle code execution within time limits', async () => {
      const mockResult = {
        output: 'Quick execution completed',
        executionTime: 50,
        memoryUsage: 30,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print("Quick execution completed")',
          language: 'python',
        })
        .expect(200);

      expect(response.body.data.executionTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should handle memory-intensive code', async () => {
      const mockResult = {
        output: 'Memory test completed',
        executionTime: 250,
        memoryUsage: 120,  // Near the limit
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'arr = [i for i in range(10000)]\\nprint("Memory test completed")',
          language: 'python',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memoryUsage).toBeLessThanOrEqual(128); // Within 128MB limit
    });
  });

  describe('Input/Output Handling', () => {
    test('should handle multi-line input correctly', async () => {
      const mockResult = {
        output: 'Line 1: Hello\\nLine 2: World\\nLine 3: Test',
        executionTime: 100,
        memoryUsage: 40,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: `
            for i in range(3):
              line = input()
              print(f"Line {i+1}: {line}")
          `,
          language: 'python',
          input: 'Hello\\nWorld\\nTest',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(codeExecutorService.executeCode).toHaveBeenCalledWith(
        expect.any(String),
        'python',
        'Hello\\nWorld\\nTest'
      );
    });

    test('should handle empty input gracefully', async () => {
      const mockResult = {
        output: 'No input provided',
        executionTime: 80,
        memoryUsage: 35,
      };

      codeExecutorService.executeCode.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print("No input provided")',
          language: 'python',
          input: '',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});