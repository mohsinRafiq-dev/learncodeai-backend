import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import User from '../../src/models/User.js';
import authRoutes from '../../src/routes/authRoutes.js';
import emailService from '../../src/services/emailService.js';
import passport from '../../src/config/passport.js';

// Setup mocking for ES modules
const mockEmailService = {
  initialize: jest.fn().mockResolvedValue(true),
  isAvailable: jest.fn().mockReturnValue(true),
  sendVerificationOTP: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  sendPasswordResetOTP: jest.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
  generateOTP: jest.fn().mockReturnValue('123456'),
};

const mockPassport = {
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    app = createTestApp();
    await User.deleteMany({});
    
    // Setup mocks for each test
    jest.spyOn(emailService, 'initialize').mockResolvedValue(true);
    jest.spyOn(emailService, 'isAvailable').mockReturnValue(true);
    jest.spyOn(emailService, 'sendVerificationOTP').mockResolvedValue({ success: true, messageId: 'test-id' });
    jest.spyOn(emailService, 'sendPasswordResetOTP').mockResolvedValue({ success: true, messageId: 'test-id' });
    jest.spyOn(emailService, 'generateOTP').mockReturnValue('123456');
    
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Account created successfully! Please check your email for verification code.');

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.isEmailVerified).toBe(false);
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Account already exists but not verified. New verification code sent to your email.');
    });

    test('should validate password confirmation', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      // Create verified user for login tests
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });
    });

    test('should login verified user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Incorrect email or password');
    });

    test('should reject unverified user login', async () => {
      // Create unverified user
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Your email is not verified. We sent a new verification code to your email.');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    test('should verify email with valid OTP', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      // Set OTP directly
      await user.setEmailVerificationOTP('123456');

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'test@example.com', otp: '123456' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();

      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.isEmailVerified).toBe(true);
    });

    test('should reject invalid verification OTP', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test2@example.com',
        password: 'password123',
      });

      await user.setEmailVerificationOTP('123456');

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'test2@example.com', otp: '999999' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    test('should resend verification email for unverified user', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Verification code sent to your email');
    });

    test('should handle already verified user', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('No pending verification found for this email');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
    });

    test('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('If an account with this email exists, you will receive a password reset code.');
    });

    test('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('If an account with this email exists, you will receive a password reset code.');
    });
  });

  describe('POST /api/auth/verify-reset-otp', () => {
    test('should verify password reset OTP successfully', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });

      // Set reset OTP directly
      await user.setPasswordResetOTP('123456');

      const response = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: 'test@example.com', otp: '123456' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OTP verified successfully');
      expect(response.body.resetToken).toBeDefined();
    });

    test('should reject invalid password reset OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: 'test@example.com', otp: '999999' })
        .expect(400);

      expect(response.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reset password with verified OTP token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'resetuser@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });

      // Set and verify reset OTP first to get token
      await user.setPasswordResetOTP('123456');
      
      const otpResponse = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: 'resetuser@example.com', otp: '123456' })
        .expect(200);

      const resetToken = otpResponse.body.resetToken;

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password reset successfully');
    });

    test('should validate password confirmation during reset', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'resetuser2@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });

      await user.setPasswordResetOTP('123456');
      
      const otpResponse = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: 'resetuser2@example.com', otp: '123456' })
        .expect(200);

      const resetToken = otpResponse.body.resetToken;

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBeUndefined();
      
      // Check that JWT cookie is cleared
      const cookies = response.headers['set-cookie'];
      const jwtCookie = cookies?.find(cookie => cookie.includes('jwt='));
      expect(jwtCookie).toContain('jwt=loggedout');
    });
  });

  describe('Authentication Flow End-to-End', () => {
    test('should complete full registration and login flow', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Step 1: Register
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(signupResponse.body.status).toBe('success');

      // Step 2: Verify email with OTP
      const user = await User.findOne({ email: userData.email });
      await user.setEmailVerificationOTP('123456');

      await request(app)
        .post('/api/auth/verify-email')
        .send({ email: userData.email, otp: '123456' })
        .expect(200);

      // Step 3: Login
      const loginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(userData.email);
    });

    test('should complete password reset flow', async () => {
      // Create verified user
      const user = await User.create({
        name: 'Password Reset User',
        email: 'reset@example.com',
        password: 'oldpassword123',
        isEmailVerified: true,
        accountStatus: 'active',
      });

      // Step 1: Request password reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      // Step 2: Set and verify reset OTP to get token
      await user.setPasswordResetOTP('123456');

      const otpResponse = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: user.email, otp: '123456' })
        .expect(200);

      // Step 3: Reset password with token
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: otpResponse.body.resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(resetResponse.body.status).toBe('success');

      // Step 4: Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: user.email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });
  });
});