import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';
import * as authController from '../../src/controllers/authController.js';
import emailService from '../../src/services/emailService.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

describe('Auth Controller Tests', () => {
  let app;

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    app = createTestApp();

    // Mock email service
    jest.spyOn(emailService, 'isAvailable').mockReturnValue(true);
    jest.spyOn(emailService, 'sendVerificationOTP').mockResolvedValue(true);
    jest.spyOn(emailService, 'sendPasswordResetOTP').mockResolvedValue(true);
    jest.spyOn(emailService, 'generateOTP').mockReturnValue('123456');
  });

  describe('Signup', () => {
    test('should create new user and send verification email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      app.post('/signup', authController.signup);

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Account created successfully! Please check your email for verification code.');
      expect(emailService.sendVerificationOTP).toHaveBeenCalled();
    });

    test('should reject signup with mismatched passwords', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      };

      app.post('/signup', authController.signup);

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });

    test('should reject signup with missing fields', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123',
      };

      app.post('/signup', authController.signup);

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Please provide name, email, password, and confirm password');
    });

    test('should reject signup with existing email', async () => {
      // Create existing user
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      app.post('/signup', authController.signup);

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('User with this email already exists and is verified');
    });
  });

  describe('Signin', () => {
    beforeEach(async () => {
      // Create verified user for signin tests
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });
    });

    test('should signin user with correct credentials', async () => {
      const signinData = {
        email: 'test@example.com',
        password: 'password123',
      };

      app.post('/signin', authController.signin);

      const response = await request(app)
        .post('/signin')
        .send(signinData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe(signinData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should reject signin with incorrect password', async () => {
      const signinData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      app.post('/signin', authController.signin);

      const response = await request(app)
        .post('/signin')
        .send(signinData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Incorrect email or password');
    });

    test('should reject signin with non-existent email', async () => {
      const signinData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      app.post('/signin', authController.signin);

      const response = await request(app)
        .post('/signin')
        .send(signinData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Incorrect email or password');
    });

    test('should reject signin with unverified email', async () => {
      // Create unverified user
      await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
        accountStatus: 'pending',
      });

      const signinData = {
        email: 'unverified@example.com',
        password: 'password123',
      };

      app.post('/signin', authController.signin);

      const response = await request(app)
        .post('/signin')
        .send(signinData)
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Your email is not verified. We sent a new verification code to your email.');
    });

    test('should reject signin with missing fields', async () => {
      const signinData = {
        email: 'test@example.com',
      };

      app.post('/signin', authController.signin);

      const response = await request(app)
        .post('/signin')
        .send(signinData)
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Please provide email and password');
    });
  });

  describe('Email Verification', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false,
        accountStatus: 'pending',
      });
    });

    test('should verify email with valid OTP', async () => {
      const user = await User.findOne({ email: 'test@example.com' });
      const otp = '123456';
      await user.setEmailVerificationOTP(otp);

      app.post('/verify-email', authController.verifyEmail);

      const response = await request(app)
        .post('/verify-email')
        .send({
          email: 'test@example.com',
          otp: otp
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('should reject invalid verification OTP', async () => {
      app.post('/verify-email', authController.verifyEmail);

      const response = await request(app)
        .post('/verify-email')
        .send({
          email: 'test@example.com',
          otp: '999999'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('No pending verification found for this email. Please request a new verification code.');
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
      });
    });

    test('should send password reset OTP for valid email', async () => {
      app.post('/request-password-reset', authController.requestPasswordReset);

      const response = await request(app)
        .post('/request-password-reset')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password reset code sent to your email');
    });

    test('should handle invalid email in password reset request', async () => {
      app.post('/request-password-reset', authController.requestPasswordReset);

      const response = await request(app)
        .post('/request-password-reset')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('If an account with this email exists, you will receive a password reset code.');
    });

    test('should verify password reset OTP and return reset token', async () => {
      const user = await User.findOne({ email: 'test@example.com' });
      const otp = '123456';
      await user.setPasswordResetOTP(otp);

      app.post('/verify-password-reset-otp', authController.verifyPasswordResetOTP);

      const response = await request(app)
        .post('/verify-password-reset-otp')
        .send({
          email: 'test@example.com',
          otp: otp
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('OTP verified successfully');
      expect(response.body.resetToken).toBeDefined();
    });

    test('should reject invalid password reset OTP', async () => {
      app.post('/verify-password-reset-otp', authController.verifyPasswordResetOTP);

      const response = await request(app)
        .post('/verify-password-reset-otp')
        .send({
          email: 'test@example.com',
          otp: '999999'
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Invalid or expired OTP');
    });

    test('should reset password with valid reset token', async () => {
      // First get a valid reset token by verifying OTP
      const user = await User.findOne({ email: 'test@example.com' });
      const otp = '123456';
      await user.setPasswordResetOTP(otp);
      
      // Simulate the token generation (normally done by verifyPasswordResetOTP)
      const resetToken = jwt.sign(
        { id: user._id, purpose: 'password-reset' },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '10m' }
      );

      app.post('/reset-password', authController.resetPassword);

      const response = await request(app)
        .post('/reset-password')
        .send({
          resetToken: resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password reset successfully');
    });

    test('should reject password reset with invalid token', async () => {
      app.post('/reset-password', authController.resetPassword);

      const response = await request(app)
        .post('/reset-password')
        .send({
          resetToken: 'invalidtoken',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    test('should reject password reset with mismatched passwords', async () => {
      const user = await User.findOne({ email: 'test@example.com' });
      const resetToken = jwt.sign(
        { id: user._id, purpose: 'password-reset' },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '10m' }
      );

      app.post('/reset-password', authController.resetPassword);

      const response = await request(app)
        .post('/reset-password')
        .send({
          resetToken: resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword',
        })
        .expect(400);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('Logout', () => {
    test('should logout user successfully', async () => {
      app.post('/logout', authController.logout);

      const response = await request(app)
        .post('/logout')
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });
});