// Functional tests for Code Execution - End-to-End Workflows
import request from 'supertest';
import app from '../../src/app.js';

// Mock the code executor service since it requires Docker
jest.mock('../../src/services/codeExecutorWSService.js');

import codeExecutorWSService from '../../src/services/codeExecutorWSService.js';

describe('Code Execution Functional Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
    // Mock successful code execution
    const mockResult = {
      output: 'Hello, World!\n',
      error: '',
      executionTime: 150,
      status: 'success'
    };

    codeExecutorWSService.executeCode.mockResolvedValue(mockResult);

    // Step 1: Get supported languages
    const languagesResponse = await request(app)
      .get('/api/code/languages')
      .expect(200);

    expect(languagesResponse.body.success).toBe(true);
    expect(Array.isArray(languagesResponse.body.data)).toBe(true);
    expect(languagesResponse.body.data.length).toBe(3);

    // Verify language options
    const languageIds = languagesResponse.body.data.map(lang => lang.id);
    expect(languageIds).toContain('python');
    expect(languageIds).toContain('cpp');
    expect(languageIds).toContain('javascript');

    // Step 2: Execute Python code
    const pythonCode = 'print("Hello, World!")';
    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: pythonCode,
        language: 'python',
        input: ''
      })
      .expect(200);

    expect(executeResponse.body.success).toBe(true);
    expect(executeResponse.body.data).toEqual(mockResult);

    // Verify the service was called correctly
    expect(codeExecutorWSService.executeCode).toHaveBeenCalledWith(
      pythonCode,
      'python',
      ''
    );
    expect(codeExecutorWSService.executeCode).toHaveBeenCalledTimes(1);
  });

  it('should show error for invalid code', async () => {
    // Mock execution with syntax error
    const mockErrorResult = {
      output: '',
      error: 'SyntaxError: invalid syntax\n',
      executionTime: 50,
      status: 'error'
    };

    codeExecutorWSService.executeCode.mockResolvedValue(mockErrorResult);

    // Step 1: Execute invalid Python code
    const invalidCode = 'print("Hello World"'; // Missing closing parenthesis
    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: invalidCode,
        language: 'python',
        input: ''
      })
      .expect(200);

    expect(executeResponse.body.success).toBe(true);
    expect(executeResponse.body.data.error).toContain('SyntaxError');
    expect(executeResponse.body.data.status).toBe('error');
    expect(executeResponse.body.data.output).toBe('');

    // Verify the service was called
    expect(codeExecutorWSService.executeCode).toHaveBeenCalledWith(
      invalidCode,
      'python',
      ''
    );
  });

  it('should handle code execution with input', async () => {
    // Mock execution that uses input
    const mockResult = {
      output: 'Hello, Alice!\nYour age is 25\n',
      error: '',
      executionTime: 200,
      status: 'success'
    };

    codeExecutorWSService.executeCode.mockResolvedValue(mockResult);

    // Python code that reads from stdin
    const codeWithInput = `
name = input("Enter your name: ")
age = input("Enter your age: ")
print(f"Hello, {name}!")
print(f"Your age is {age}")
    `;

    const inputData = 'Alice\n25\n';

    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: codeWithInput,
        language: 'python',
        input: inputData
      })
      .expect(200);

    expect(executeResponse.body.success).toBe(true);
    expect(executeResponse.body.data.output).toContain('Hello, Alice!');
    expect(executeResponse.body.data.output).toContain('Your age is 25');
    expect(executeResponse.body.data.status).toBe('success');

    // Verify the service was called with input
    expect(codeExecutorWSService.executeCode).toHaveBeenCalledWith(
      codeWithInput,
      'python',
      inputData
    );
  });

  it('should reject unsupported languages', async () => {
    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: 'console.log("Hello");',
        language: 'ruby', // Unsupported language
        input: ''
      })
      .expect(400);

    expect(executeResponse.body.success).toBe(false);
    expect(executeResponse.body.message).toContain('Unsupported language');
    expect(executeResponse.body.message).toContain('python');
    expect(executeResponse.body.message).toContain('cpp');
    expect(executeResponse.body.message).toContain('javascript');

    // Verify the service was NOT called
    expect(codeExecutorWSService.executeCode).not.toHaveBeenCalled();
  });

  it('should handle execution timeout', async () => {
    // Mock execution that times out
    const mockTimeoutResult = {
      output: '',
      error: 'Execution timeout: Code execution took longer than 30 seconds\n',
      executionTime: 30000,
      status: 'timeout'
    };

    codeExecutorWSService.executeCode.mockResolvedValue(mockTimeoutResult);

    // Code that would potentially run forever
    const infiniteLoopCode = `
while True:
    pass
    `;

    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: infiniteLoopCode,
        language: 'python',
        input: ''
      })
      .expect(200);

    expect(executeResponse.body.success).toBe(true);
    expect(executeResponse.body.data.error).toContain('timeout');
    expect(executeResponse.body.data.status).toBe('timeout');
    expect(executeResponse.body.data.executionTime).toBe(30000);
  });

  it('should validate required parameters', async () => {
    // Test missing code
    const noCodeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        language: 'python',
        input: ''
      })
      .expect(400);

    expect(noCodeResponse.body.success).toBe(false);
    expect(noCodeResponse.body.message).toContain('Code and language are required');

    // Test missing language
    const noLanguageResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: 'print("test")',
        input: ''
      })
      .expect(400);

    expect(noLanguageResponse.body.success).toBe(false);
    expect(noLanguageResponse.body.message).toContain('Code and language are required');

    // Verify the service was NOT called for either request
    expect(codeExecutorWSService.executeCode).not.toHaveBeenCalled();
  });

  it('should execute different language codes', async () => {
    // Test JavaScript execution
    const jsMockResult = {
      output: 'Hello from JavaScript!\n',
      error: '',
      executionTime: 100,
      status: 'success'
    };

    codeExecutorWSService.executeCode.mockResolvedValueOnce(jsMockResult);

    const jsCode = 'console.log("Hello from JavaScript!");';
    const jsResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: jsCode,
        language: 'javascript',
        input: ''
      })
      .expect(200);

    expect(jsResponse.body.data.output).toBe('Hello from JavaScript!\n');

    // Test C++ execution
    const cppMockResult = {
      output: 'Hello from C++!\n',
      error: '',
      executionTime: 250,
      status: 'success'
    };

    codeExecutorWSService.executeCode.mockResolvedValueOnce(cppMockResult);

    const cppCode = `
#include <iostream>
int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
    `;

    const cppResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: cppCode,
        language: 'cpp',
        input: ''
      })
      .expect(200);

    expect(cppResponse.body.data.output).toBe('Hello from C++!\n');

    // Verify both calls were made
    expect(codeExecutorWSService.executeCode).toHaveBeenCalledTimes(2);
  });

  it('should handle service execution errors', async () => {
    // Mock service throwing an error
    codeExecutorWSService.executeCode.mockRejectedValue(
      new Error('Docker container not available')
    );

    const executeResponse = await request(app)
      .post('/api/code/execute')
      .send({
        code: 'print("test")',
        language: 'python',
        input: ''
      })
      .expect(500);

    expect(executeResponse.body.success).toBe(false);
    expect(executeResponse.body.message).toContain('Code execution failed');
    expect(executeResponse.body.error).toContain('Docker container not available');
  });
});
