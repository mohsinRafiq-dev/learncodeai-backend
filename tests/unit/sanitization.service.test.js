import sanitizationService from '../../src/services/sanitizationService.js';

describe('SanitizationService', () => {
  describe('sanitizeCode', () => {
    test('should accept valid Python code', () => {
      const code = 'print("Hello, World!")';
      const result = sanitizationService.sanitizeCode(code, 'python');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject Python code with os module import', () => {
      const code = 'import os\nprint(os.getcwd())';
      const result = sanitizationService.sanitizeCode(code, 'python');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dangerous patterns'))).toBe(true);
    });

    test('should reject code exceeding maximum size', () => {
      const largeCode = 'x = ' + '1'.repeat(sanitizationService.MAX_CODE_SIZE + 1);
      const result = sanitizationService.sanitizeCode(largeCode, 'python');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum size'))).toBe(true);
    });

    test('should reject code with null bytes', () => {
      const code = 'print("hello\0world")';
      const result = sanitizationService.sanitizeCode(code, 'python');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Null bytes'))).toBe(true);
    });

    test('should reject Python code with eval()', () => {
      const code = 'eval("print(1)")';
      const result = sanitizationService.sanitizeCode(code, 'python');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dangerous patterns'))).toBe(true);
    });

    test('should reject C++ code with system calls', () => {
      const code = `#include <iostream>
int main() {
  system("ls -la");
  return 0;
}`;
      const result = sanitizationService.sanitizeCode(code, 'cpp');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dangerous patterns'))).toBe(true);
    });

    test('should reject JavaScript with require("fs")', () => {
      const code = 'const fs = require("fs");\nfs.readFileSync("/etc/passwd")';
      const result = sanitizationService.sanitizeCode(code, 'javascript');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Dangerous patterns'))).toBe(true);
    });

    test('should trim whitespace from code', () => {
      const code = '  \n  print("test")  \n  ';
      const result = sanitizationService.sanitizeCode(code, 'python');
      expect(result.code).toBe('print("test")');
    });

    test('should return empty code string on invalid input', () => {
      const result = sanitizationService.sanitizeCode('', 'python');
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    test('should accept valid input', () => {
      const input = 'Hello\nWorld\n123';
      const result = sanitizationService.sanitizeInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle null/undefined input gracefully', () => {
      expect(sanitizationService.sanitizeInput(null).isValid).toBe(true);
      expect(sanitizationService.sanitizeInput(undefined).isValid).toBe(true);
    });

    test('should reject input exceeding maximum size', () => {
      const largeInput = 'x'.repeat(sanitizationService.MAX_INPUT_SIZE + 1);
      const result = sanitizationService.sanitizeInput(largeInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum size'))).toBe(true);
    });

    test('should remove control characters but keep newlines and tabs', () => {
      const input = 'Hello\x00World\x01Test\nLine\tTab';
      const result = sanitizationService.sanitizeInput(input);
      expect(result.input).not.toContain('\x00');
      expect(result.input).not.toContain('\x01');
      expect(result.input).toContain('\n');
      expect(result.input).toContain('\t');
    });

    test('should reject non-string input', () => {
      const result = sanitizationService.sanitizeInput(12345);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be a string'))).toBe(true);
    });
  });

  describe('escapeOutput', () => {
    test('should escape HTML special characters', () => {
      const output = '<script>alert("XSS")</script>';
      const escaped = sanitizationService.escapeOutput(output);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
    });

    test('should escape ampersands', () => {
      const output = 'A & B & C';
      const escaped = sanitizationService.escapeOutput(output);
      expect(escaped).toBe('A &amp; B &amp; C');
    });

    test('should escape single quotes', () => {
      const output = "It's a test";
      const escaped = sanitizationService.escapeOutput(output);
      expect(escaped).toBe('It&#x27;s a test');
    });

    test('should truncate output exceeding maximum size', () => {
      const largeOutput = 'x'.repeat(sanitizationService.MAX_OUTPUT_SIZE + 1000);
      const escaped = sanitizationService.escapeOutput(largeOutput);
      expect(escaped.length).toBeLessThan(largeOutput.length);
      expect(escaped).toContain('truncated');
    });

    test('should handle empty/null output', () => {
      expect(sanitizationService.escapeOutput('')).toBe('');
      expect(sanitizationService.escapeOutput(null)).toBe('');
      expect(sanitizationService.escapeOutput(undefined)).toBe('');
    });
  });

  describe('escapeError', () => {
    test('should escape error messages', () => {
      const error = 'Error: <div>onclick="alert(1)"</div>';
      const escaped = sanitizationService.escapeError(error);
      expect(escaped).not.toContain('<div>');
      expect(escaped).toContain('&lt;div&gt;');
    });

    test('should truncate long error messages', () => {
      const longError = 'x'.repeat(6000);
      const escaped = sanitizationService.escapeError(longError);
      expect(escaped.length).toBeLessThan(longError.length);
      expect(escaped).toContain('truncated');
    });
  });

  describe('validateExecutionRequest', () => {
    test('should validate complete request', () => {
      const request = {
        code: 'print("test")',
        language: 'python',
        input: 'test input'
      };
      const result = sanitizationService.validateExecutionRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid language', () => {
      const request = {
        code: 'print("test")',
        language: 'ruby',
        input: ''
      };
      const result = sanitizationService.validateExecutionRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid language'))).toBe(true);
    });

    test('should collect multiple validation errors', () => {
      const request = {
        code: 'import os\nprint(os.getcwd())',
        language: 'ruby',
        input: 'x'.repeat(sanitizationService.MAX_INPUT_SIZE + 1)
      };
      const result = sanitizationService.validateExecutionRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should return sanitized values on success', () => {
      const request = {
        code: '  print("test")  ',
        language: 'python',
        input: null
      };
      const result = sanitizationService.validateExecutionRequest(request);
      expect(result.sanitized.code).toBe('print("test")');
      expect(result.sanitized.input).toBe('');
    });
  });

  describe('sanitizeExecutionResult', () => {
    test('should sanitize execution result', () => {
      const result = {
        output: '<div>Safe output</div>',
        error: '',
        exitCode: 0,
        executionTime: 125
      };
      const sanitized = sanitizationService.sanitizeExecutionResult(result);
      expect(sanitized.output).not.toContain('<div>');
      expect(sanitized.output).toContain('&lt;div&gt;');
      expect(sanitized.exitCode).toBe(0);
    });

    test('should handle missing fields in result', () => {
      const result = {};
      const sanitized = sanitizationService.sanitizeExecutionResult(result);
      expect(sanitized.output).toBe('');
      expect(sanitized.error).toBe('');
      expect(sanitized.exitCode).toBe(0);
    });
  });

  describe('validateLanguageSpecific', () => {
    test('should validate C++ has main function', () => {
      const code = '#include <iostream>';
      const result = sanitizationService.validateLanguageSpecific(code, 'cpp');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('main()'))).toBe(true);
    });

    test('should validate JavaScript has console output', () => {
      const code = 'const x = 5;';
      const result = sanitizationService.validateLanguageSpecific(code, 'javascript');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('console'))).toBe(true);
    });

    test('should accept valid language-specific code', () => {
      expect(sanitizationService.validateLanguageSpecific('print("test")', 'python').isValid).toBe(true);
      expect(sanitizationService.validateLanguageSpecific('#include <iostream>\nint main() {}', 'cpp').isValid).toBe(true);
      expect(sanitizationService.validateLanguageSpecific('console.log("test")', 'javascript').isValid).toBe(true);
    });
  });
});
