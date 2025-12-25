// Unit tests for Code Executor Service
import codeExecutorService, { CodeExecutorService } from '../../src/services/codeExecutorService.js';
import fs from 'fs/promises';
import path from 'path';

describe('Code Executor Service', () => {
  let service;

  beforeEach(() => {
    service = new CodeExecutorService();
  });

  describe('getLanguageConfig', () => {
    it('should return correct config for python', () => {
      const config = service.getLanguageConfig('python');
      expect(config).toEqual({
        filename: 'main.py',
        dockerfile: 'Dockerfile.python'
      });
    });

    it('should return correct config for cpp', () => {
      const config = service.getLanguageConfig('cpp');
      expect(config).toEqual({
        filename: 'main.cpp',
        dockerfile: 'Dockerfile.cpp'
      });
    });

    it('should return correct config for javascript', () => {
      const config = service.getLanguageConfig('javascript');
      expect(config).toEqual({
        filename: 'main.js',
        dockerfile: 'Dockerfile.javascript'
      });
    });

    it('should throw error for unsupported language', () => {
      expect(() => {
        service.getLanguageConfig('unsupported');
      }).toThrow('Unsupported language: unsupported');
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = service.generateSessionId();
      const id2 = service.generateSessionId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('executeCode', () => {
    // Note: These tests would require Docker to be running
    // For now, we'll test the method structure and error handling
    it('should handle unsupported language', async () => {
      try {
        await service.executeCode('print("test")', 'unsupported');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Unsupported language');
      }
    });
  });

  describe('cleanup', () => {
    it('should cleanup session directory', async () => {
      const testDir = path.join(service.tempDir, 'test_cleanup_dir');
      await fs.mkdir(testDir, { recursive: true });
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Verify directory exists
      let exists = true;
      try {
        await fs.access(testDir);
      } catch {
        exists = false;
      }
      expect(exists).toBe(true);

      // Cleanup
      await service.cleanup(testDir);

      // Verify directory is removed
      exists = true;
      try {
        await fs.access(testDir);
      } catch {
        exists = false;
      }
      expect(exists).toBe(false);
    });
  });
});
