import { describe, test, expect, beforeEach } from '@jest/globals';
import User from '../../src/models/User.js';

describe('User Model Tests', () => {
  beforeEach(() => {
    // Clear any existing users before each test
    return User.deleteMany({});
  });

  describe('User Creation', () => {
    test('should create a valid user with email and password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.isEmailVerified).toBe(false);
      expect(user.role).toBe('user');
      expect(user.googleId).toBeNull();
      expect(user.githubId).toBeNull();
      expect(user.accountStatus).toBe('pending');
    });

    test('should create a valid OAuth user without password', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        googleId: 'google123',
        isEmailVerified: true,
        accountStatus: 'active',
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.googleId).toBe(userData.googleId);
      expect(user.isEmailVerified).toBe(true);
      expect(user.accountStatus).toBe('active');
      expect(user.password).toBeUndefined();
    });

    test('should convert email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      };

      const user = await User.create(userData);
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Validation', () => {
    test('should require name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow('Name is required');
    });

    test('should require email', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow('Email is required');
    });

    test('should require password for non-OAuth users', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow('Please provide a valid email');
    });

    test('should validate name length', async () => {
      const userData = {
        name: 'A',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow('Name must be at least 2 characters long');
    });

    test('should validate password length', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345',
      };

      await expect(User.create(userData)).rejects.toThrow('Password must be at least 6 characters long');
    });

    test('should enforce unique email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    test('should verify correct password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const isMatch = await user.correctPassword('password123', user.password);
      expect(isMatch).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const isMatch = await user.correctPassword('wrongpassword', user.password);
      expect(isMatch).toBe(false);
    });
  });

  describe('Password Reset OTP', () => {
    test('should set password reset OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setPasswordResetOTP(otp);

      expect(user.passwordResetOTP).toBe(otp);
      expect(user.passwordResetOTPExpires).toBeDefined();
      expect(user.passwordResetOTPExpires.getTime()).toBeGreaterThan(Date.now());
    });

    test('should verify password reset OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setPasswordResetOTP(otp);

      const isValid = user.verifyPasswordResetOTP(otp);
      expect(isValid).toBe(true);

      const isInvalid = user.verifyPasswordResetOTP('wrong-otp');
      expect(isInvalid).toBe(false);
    });

    test('should reject expired password reset OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      
      // Set OTP with past expiration date
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = new Date(Date.now() - 1000); // 1 second ago
      await user.save({ validateBeforeSave: false });

      const isValid = user.verifyPasswordResetOTP(otp);
      expect(isValid).toBe(false);
    });

    test('should clear password reset OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setPasswordResetOTP(otp);

      expect(user.passwordResetOTP).toBe(otp);
      
      await user.clearPasswordResetOTP();
      
      expect(user.passwordResetOTP).toBeNull();
      expect(user.passwordResetOTPExpires).toBeNull();
    });
  });

  describe('Email Verification OTP', () => {
    test('should set email verification OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setEmailVerificationOTP(otp);

      expect(user.emailVerificationOTP).toBe(otp);
      expect(user.emailVerificationOTPExpires).toBeDefined();
      expect(user.emailVerificationOTPExpires.getTime()).toBeGreaterThan(Date.now());
    });

    test('should verify email OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setEmailVerificationOTP(otp);

      const isValid = user.verifyEmailOTP(otp);
      expect(isValid).toBe(true);

      const isInvalid = user.verifyEmailOTP('wrong-otp');
      expect(isInvalid).toBe(false);
    });

    test('should reject expired email verification OTP', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      
      // Set OTP with past expiration date
      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpires = new Date(Date.now() - 1000); // 1 second ago
      await user.save({ validateBeforeSave: false });

      const isValid = user.verifyEmailOTP(otp);
      expect(isValid).toBe(false);
    });

    test('should clear email verification OTP and activate account', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      const otp = '123456';
      await user.setEmailVerificationOTP(otp);

      expect(user.isEmailVerified).toBe(false);
      expect(user.emailVerificationOTP).toBe(otp);
      
      await user.clearEmailVerificationOTP();
      
      expect(user.emailVerificationOTP).toBeNull();
      expect(user.emailVerificationOTPExpires).toBeNull();
      expect(user.isEmailVerified).toBe(true);
      expect(user.accountStatus).toBe('active');
    });
  });

  describe('User Methods', () => {
    test('should update last login', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);
      expect(user.lastLogin).toBeNull();

      user.lastLogin = new Date();
      await user.save();

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin).toBeInstanceOf(Date);
    });

    test('should handle role assignment', async () => {
      const userData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      };

      const user = await User.create(userData);
      expect(user.role).toBe('admin');
    });
  });
});