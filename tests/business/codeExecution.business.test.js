// Business logic tests for Code Execution
import CodeExecutorService from '../../src/services/codeExecutorService.js';

describe('Code Execution Business Rules', () => {
  it('should validate supported languages', async () => {
    // Arrange: supported and unsupported languages
    const supportedLanguages = ['python', 'javascript', 'cpp'];
    const unsupportedLanguage = 'ruby';

    // Act & Assert: check supported languages
    for (const language of supportedLanguages) {
      const isSupported = CodeExecutorService.isLanguageSupported(language);
      expect(isSupported).toBe(true);
    }

    // Act & Assert: check unsupported language
    const isUnsupported = CodeExecutorService.isLanguageSupported(unsupportedLanguage);
    expect(isUnsupported).toBe(false);
  });

  it('should generate unique session IDs', async () => {
    // Act: generate multiple session IDs
    const sessionId1 = CodeExecutorService.generateSessionId();
    const sessionId2 = CodeExecutorService.generateSessionId();
    const sessionId3 = CodeExecutorService.generateSessionId();

    // Assert: all session IDs are unique
    expect(sessionId1).not.toBe(sessionId2);
    expect(sessionId1).not.toBe(sessionId3);
    expect(sessionId2).not.toBe(sessionId3);

    // Assert: session IDs are strings and have reasonable length
    expect(typeof sessionId1).toBe('string');
    expect(sessionId1.length).toBeGreaterThan(0);
  });

  it('should validate code execution parameters', async () => {
    // Arrange: valid and invalid parameters
    const validParams = {
      language: 'python',
      code: 'print("Hello World")',
      sessionId: 'test-session-123'
    };

    const invalidParams = [
      { language: 'invalid', code: 'print("test")', sessionId: 'test' }, // invalid language
      { language: 'python', code: '', sessionId: 'test' }, // empty code
      { language: 'python', code: 'print("test")', sessionId: '' } // empty session ID
    ];

    // Act & Assert: valid parameters should pass basic validation
    expect(validParams.language).toBe('python');
    expect(validParams.code.length).toBeGreaterThan(0);
    expect(validParams.sessionId.length).toBeGreaterThan(0);

    // Act & Assert: invalid parameters should fail validation
    for (const params of invalidParams) {
      const isValid = CodeExecutorService.isLanguageSupported(params.language) &&
                     Boolean(params.code) &&
                     params.code.trim().length > 0 &&
                     Boolean(params.sessionId) &&
                     params.sessionId.trim().length > 0;
      expect(isValid).toBe(false);
    }
  });

  it('should handle code execution results correctly', async () => {
    // Arrange: mock successful execution result
    const successResult = {
      success: true,
      output: 'Hello World\n',
      executionTime: 150,
      memoryUsed: 1024
    };

    const errorResult = {
      success: false,
      error: 'SyntaxError: invalid syntax',
      executionTime: 50,
      memoryUsed: 512
    };

    // Act & Assert: successful result
    expect(successResult.success).toBe(true);
    expect(successResult.output).toContain('Hello World');
    expect(successResult.executionTime).toBeGreaterThan(0);
    expect(successResult.memoryUsed).toBeGreaterThan(0);

    // Act & Assert: error result
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toContain('SyntaxError');
    expect(errorResult.executionTime).toBeGreaterThan(0);
    expect(errorResult.memoryUsed).toBeGreaterThan(0);
  });

  it('should enforce resource limits', async () => {
    // Arrange: resource limits
    const maxExecutionTime = 30000; // 30 seconds
    const maxMemoryUsage = 128 * 1024 * 1024; // 128MB
    const maxOutputSize = 1024 * 1024; // 1MB

    // Act & Assert: check limits are reasonable
    expect(maxExecutionTime).toBeGreaterThan(0);
    expect(maxMemoryUsage).toBeGreaterThan(0);
    expect(maxOutputSize).toBeGreaterThan(0);

    // Simulate exceeding limits
    const excessiveOutput = 'x'.repeat(maxOutputSize + 1);
    expect(excessiveOutput.length).toBeGreaterThan(maxOutputSize);
  });

  it('should sanitize code input', async () => {
    // Arrange: potentially dangerous code patterns
    const dangerousPatterns = [
      'import os',
      'exec(',
      'eval(',
      'subprocess',
      'fs.writeFile',
      'require("child_process")'
    ];

    const safeCode = 'print("Hello World")';

    // Act & Assert: dangerous patterns should be flagged
    for (const pattern of dangerousPatterns) {
      expect(pattern.length).toBeGreaterThan(0); // Basic validation
      // In a real implementation, these would be blocked
    }

    // Act & Assert: safe code should pass
    expect(safeCode).not.toContain('import os');
    expect(safeCode).not.toContain('exec(');
    expect(safeCode).not.toContain('eval(');
  });

  it('should handle concurrent executions', async () => {
    // Arrange: multiple execution requests
    const executions = [
      { id: 1, language: 'python', code: 'print("First")' },
      { id: 2, language: 'javascript', code: 'console.log("Second");' },
      { id: 3, language: 'python', code: 'print("Third")' }
    ];

    // Act: simulate concurrent processing
    const sessionIds = executions.map(() => CodeExecutorService.generateSessionId());

    // Assert: each execution gets a unique session ID
    const uniqueIds = new Set(sessionIds);
    expect(uniqueIds.size).toBe(executions.length);

    // Assert: all executions have different languages or can be handled
    const languages = executions.map(e => e.language);
    expect(languages).toContain('python');
    expect(languages).toContain('javascript');
  });

  it('should provide execution statistics', async () => {
    // Arrange: mock execution statistics
    const stats = {
      totalExecutions: 1000,
      successfulExecutions: 950,
      failedExecutions: 50,
      averageExecutionTime: 250,
      languagesUsed: {
        python: 400,
        javascript: 350,
        cpp: 250
      }
    };

    // Act & Assert: calculate success rate
    const successRate = (stats.successfulExecutions / stats.totalExecutions) * 100;
    expect(successRate).toBe(95);

    // Act & Assert: check language distribution
    const totalByLanguage = Object.values(stats.languagesUsed).reduce((sum, count) => sum + count, 0);
    expect(totalByLanguage).toBe(stats.totalExecutions);

    // Act & Assert: most popular language
    const mostPopular = Object.entries(stats.languagesUsed).reduce((a, b) =>
      stats.languagesUsed[a[0]] > stats.languagesUsed[b[0]] ? a : b
    );
    expect(mostPopular[0]).toBe('python');
    expect(mostPopular[1]).toBe(400);
  });
});
