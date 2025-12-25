import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import emailService from '../../src/services/emailService.js';
import nodemailer from 'nodemailer';

describe('Email Service Tests', () => {
  let mockTransporter;
  let mockSendMail;
  let createTransportSpy;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    mockTransporter = {
      sendMail: mockSendMail,
      verify: jest.fn().mockResolvedValue(true),
    };

    // Setup nodemailer spy
    createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockReturnValue(mockTransporter);

    // Reset email service state
    emailService.transporter = null;
    emailService.initialized = false;

    // Mock environment variables
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password';
    process.env.EMAIL_SECURE = 'false';

    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize email service successfully', async () => {
      await emailService.initialize();

      expect(emailService.initialized).toBe(true);
      expect(emailService.transporter).toBeDefined();
      expect(emailService.isAvailable()).toBe(true);
    });

    test('should not initialize when email credentials are missing', async () => {
      delete process.env.EMAIL_HOST;
      
      await emailService.initialize();

      expect(emailService.initialized).toBe(false);
      expect(emailService.isAvailable()).toBe(false);
    });

    test('should handle initialization errors gracefully', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('SMTP connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await emailService.initialize();

      expect(emailService.initialized).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('❌ Email service initialization failed:', 'SMTP connection failed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('OTP Generation', () => {
    test('should generate 6-digit OTP', () => {
      const otp = emailService.generateOTP();
      
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    test('should generate different OTPs', () => {
      const otp1 = emailService.generateOTP();
      const otp2 = emailService.generateOTP();
      
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('Send Verification OTP', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    test('should send verification OTP email successfully', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const name = 'Test User';

      const result = await emailService.sendVerificationOTP(email, otp, name);

      expect(result).toEqual({ success: true, messageId: 'test-id' });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Verify Your Email - CodeHub',
        html: expect.stringContaining(otp),
      });
    });

    test('should include user name in verification email', async () => {
      const email = 'user@example.com';
      const otp = '123456';
      const name = 'John Doe';

      await emailService.sendVerificationOTP(email, otp, name);

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain(name);
    });

    test('should use default name when not provided', async () => {
      const email = 'user@example.com';
      const otp = '123456';

      await emailService.sendVerificationOTP(email, otp);

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('User');
    });

    test('should handle send email errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      await expect(emailService.sendVerificationOTP('user@example.com', '123456')).rejects.toThrow('Failed to send verification email');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should not send email if service not available', async () => {
      emailService.initialized = false;

      await expect(emailService.sendVerificationOTP('user@example.com', '123456')).rejects.toThrow('Email service is not available');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('Send Password Reset OTP', () => {
    beforeEach(async () => {
      await emailService.initialize();
    });

    test('should send password reset OTP email successfully', async () => {
      const email = 'user@example.com';
      const otp = '654321';
      const name = 'Test User';

      const result = await emailService.sendPasswordResetOTP(email, otp, name);

      expect(result).toEqual({ success: true, messageId: 'test-id' });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: 'Reset Your Password - CodeHub',
        html: expect.stringContaining(otp),
      });
    });

    test('should include security warning in reset email', async () => {
      await emailService.sendPasswordResetOTP('user@example.com', '654321', 'User');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('If you didn\'t request a password reset');
    });

    test('should include expiration information', async () => {
      await emailService.sendPasswordResetOTP('user@example.com', '654321', 'User');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('15 minutes');
    });

    test('should handle send email errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      await expect(emailService.sendPasswordResetOTP('user@example.com', '654321')).rejects.toThrow('Failed to send password reset email');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    test('should use environment variables for SMTP configuration', async () => {
      process.env.EMAIL_HOST = 'smtp.custom.com';
      process.env.EMAIL_PORT = '465';
      process.env.EMAIL_SECURE = 'true';
      process.env.EMAIL_USER = 'custom@example.com';
      process.env.EMAIL_PASS = 'custompass';

      await emailService.initialize();

      expect(createTransportSpy).toHaveBeenCalledWith({
        host: 'smtp.custom.com',
        port: '465',
        secure: true,
        auth: {
          user: 'custom@example.com',
          pass: 'custompass',
        },
      });
    });
  });

  describe('Service Availability', () => {
    test('should return false when not initialized', () => {
      expect(emailService.isAvailable()).toBe(false);
    });

    test('should return true when properly initialized', async () => {
      await emailService.initialize();
      
      expect(emailService.isAvailable()).toBe(true);
    });
  });
});