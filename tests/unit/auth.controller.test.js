// Unit tests for Authentication Controller
import { jest } from '@jest/globals';

import {
  signup,
  signin,
  verifyEmail,
  resendVerificationOTP,
  protect,
  logout,
  oauthSuccess,
  oauthFailure,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword
} from '../../src/controllers/authController.js';
import User from '../../src/models/User.js';
// import emailService from '../../src/services/emailService.js';
import jwt from 'jsonwebtoken';

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}, user = null, headers = {}) => ({
  body,
  params,
  query,
  user,
  headers,
  connection: { remoteAddress: '127.0.0.1' }
});

const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  res.cookie = function(name, value, options) {
    this.cookies = this.cookies || {};
    this.cookies[name] = { value, options };
    return this;
  };
  res.clearCookie = function(name) {
    this.clearedCookies = this.clearedCookies || [];
    this.clearedCookies.push(name);
    return this;
  };
  res.redirect = function(url) {
    this.redirectedTo = url;
    this.statusCode = 302; // Default redirect status
    return this;
  };
  return res;
};

const mockNext = jest.fn();

describe('Authentication Controller', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  describe('signup', () => {
    it('should create user with valid data', async () => {
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.data.user.name).toBe('Test User');
      expect(res.responseData.data.user.email).toBe('test@example.com');

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
    });

    it('should reject signup with missing fields', async () => {
      const req = mockRequest({
        name: 'Test User',
        // missing email, password, confirmPassword
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Please provide name, email, password, and confirm password');
    });

    it('should reject signup with mismatched passwords', async () => {
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword'
      });
      const res = mockResponse();

      await signup(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Passwords do not match');
    });
  });

  describe('signin', () => {
    beforeEach(async () => {
      // Create a test user for signin tests
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active'
      });
      await user.save();
    });

    it('should signin user with correct credentials', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.token).toBeDefined();
      expect(res.responseData.data.user.name).toBe('Test User');
      expect(res.responseData.data.user.email).toBe('test@example.com');
    });

    it('should reject signin with wrong password', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Incorrect email or password');
    });

    it('should reject signin with non-existent email', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Incorrect email or password');
    });

    it('should reject signin with unverified email', async () => {
      // Create unverified user
      const user = new User({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
        accountStatus: 'active'
      });
      await user.save();

      const req = mockRequest({
        email: 'unverified@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Please verify your email before signing in');
    });

    it('should reject signin with suspended account', async () => {
      // Create suspended user
      const user = new User({
        name: 'Suspended User',
        email: 'suspended@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'suspended'
      });
      await user.save();

      const req = mockRequest({
        email: 'suspended@example.com',
        password: 'password123'
      });
      const res = mockResponse();

      await signin(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Your account has been suspended. Please contact support for more information.');
    });
  });

  describe('verifyEmail', () => {
    let userId;
    let verificationOTP;

    beforeEach(async () => {
      // Create a user with verification OTP
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        emailVerificationOTP: '123456',
        emailVerificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        isEmailVerified: false
      });
      await user.save();
      userId = user._id.toString();
      verificationOTP = user.emailVerificationOTP;
    });

    it('should verify email with correct OTP', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        otp: verificationOTP
      });
      const res = mockResponse();

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.token).toBeDefined();
      expect(res.responseData.data.user).toBeDefined();

      // Verify user was updated
      const user = await User.findById(userId);
      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationOTP).toBeNull();
    });

    it('should reject verification with wrong OTP', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        otp: 'wrongotp'
      });
      const res = mockResponse();

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid or expired OTP');
    });

    it('should reject verification with expired OTP', async () => {
      // Update user with expired OTP
      await User.findByIdAndUpdate(userId, {
        emailVerificationOTPExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });

      const req = mockRequest({
        email: 'test@example.com',
        otp: verificationOTP
      });
      const res = mockResponse();

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid or expired OTP');
    });

    it('should reject verification for non-existent email', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com',
        otp: '123456'
      });
      const res = mockResponse();

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid email address');
    });
  });

  describe('resendVerificationOTP', () => {
    beforeEach(async () => {
      // Create an unverified user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: false
      });
      await user.save();
    });

    it('should resend verification OTP for unverified user', async () => {
      const req = mockRequest({
        email: 'test@example.com'
      });
      const res = mockResponse();

      await resendVerificationOTP(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('Verification code sent to your email');

      // Verify email service was called
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject resend for already verified user', async () => {
      // Update user to be verified
      await User.findOneAndUpdate({ email: 'test@example.com' }, { isEmailVerified: true });

      const req = mockRequest({
        email: 'test@example.com'
      });
      const res = mockResponse();

      await resendVerificationOTP(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('No pending verification found for this email');
    });

    it('should reject resend for non-existent email', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com'
      });
      const res = mockResponse();

      await resendVerificationOTP(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('No pending verification found for this email');
    });
  });

  describe('protect middleware', () => {
    let userId;

    beforeEach(async () => {
      // Create a test user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active'
      });
      await user.save();
      userId = user._id.toString();
    });

    it('should allow access with valid JWT token', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij' + Buffer.from(userId).toString('base64') + 'In0.test';
      const req = mockRequest({}, {}, {}, null, { authorization: `Bearer ${token}` });
      const res = mockResponse();

      // Mock jwt.verify
      jwt.verify = jest.fn().mockReturnValue({ id: userId });

      await protect(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(userId);
    });

    it('should reject access without token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should reject access with invalid token', async () => {
      const req = mockRequest({}, {}, {}, null, { authorization: 'Bearer invalidtoken' });
      const res = mockResponse();

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await protect(req, res, mockNext);

      expect(res.statusCode).toBe(401);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid token. Please log in again!');
    });

    it('should reject access for suspended user', async () => {
      // Update user to be suspended
      await User.findByIdAndUpdate(userId, { accountStatus: 'suspended' });

      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij' + Buffer.from(userId).toString('base64') + 'In0.test';
      const req = mockRequest({}, {}, {}, null, { authorization: `Bearer ${token}` });
      const res = mockResponse();

      jwt.verify = jest.fn().mockReturnValue({ id: userId });

      await protect(req, res, mockNext);

      expect(res.statusCode).toBe(403);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Your account has been suspended. Please contact support.');
    });
  });

  describe('logout', () => {
    it('should logout user by clearing cookie', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await logout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.cookies.jwt.value).toBe('loggedout');
    });
  });

  describe('oauthSuccess', () => {
    it('should handle OAuth success', async () => {
      const user = { _id: 'user123', name: 'OAuth User', updateLastLogin: jest.fn() };
      const req = mockRequest({}, {}, {}, user);
      const res = mockResponse();

      await oauthSuccess(req, res);

      expect(res.statusCode).toBe(302);
      expect(res.redirectedTo).toContain('/auth/success?token=');
    });

    it('should handle OAuth success without user', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await oauthSuccess(req, res);

      expect(res.statusCode).toBe(302);
      expect(res.redirectedTo).toBe(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    });
  });

  describe('oauthFailure', () => {
    it('should handle OAuth failure', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await oauthFailure(req, res);

      expect(res.statusCode).toBe(302);
      expect(res.redirectedTo).toBe(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    });
  });

  describe('requestPasswordReset', () => {
    beforeEach(async () => {
      // Create a verified user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      await user.save();
    });

    it('should request password reset for valid email', async () => {
      const req = mockRequest({
        email: 'test@example.com'
      });
      const res = mockResponse();

      await requestPasswordReset(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('Password reset code sent to your email');

      // Verify email service was called
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should reject password reset for non-existent email', async () => {
      const req = mockRequest({
        email: 'nonexistent@example.com'
      });
      const res = mockResponse();

      await requestPasswordReset(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('If an account with this email exists, you will receive a password reset code.');
    });

    it('should reject password reset for unverified email', async () => {
      // Update user to be unverified
      await User.findOneAndUpdate({ email: 'test@example.com' }, { isEmailVerified: false });

      const req = mockRequest({
        email: 'test@example.com'
      });
      const res = mockResponse();

      await requestPasswordReset(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('If an account with this email exists, you will receive a password reset code.');
    });
  });

  describe('verifyPasswordResetOTP', () => {
    let userId;
    let resetOTP;

    beforeEach(async () => {
      // Create a user with password reset OTP
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        accountStatus: 'active',
        passwordResetOTP: '654321',
        passwordResetOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        isEmailVerified: true
      });
      await user.save();
      userId = user._id.toString();
      resetOTP = user.passwordResetOTP;
    });

    it('should verify password reset OTP with correct code', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        otp: resetOTP
      });
      const res = mockResponse();

      await verifyPasswordResetOTP(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('OTP verified successfully');
    });

    it('should reject verification with wrong OTP', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        otp: 'wrongotp'
      });
      const res = mockResponse();

      await verifyPasswordResetOTP(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid or expired OTP');
    });

    it('should reject verification with expired OTP', async () => {
      // Update user with expired OTP
      await User.findByIdAndUpdate(userId, {
        passwordResetOTPExpires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });

      const req = mockRequest({
        email: 'test@example.com',
        otp: resetOTP
      });
      const res = mockResponse();

      await verifyPasswordResetOTP(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Invalid or expired OTP');
    });
  });

  describe('resetPassword', () => {
    let userId;
    let resetOTP;

    beforeEach(async () => {
      // Create a user with verified password reset OTP
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordResetOTP: '654321',
        passwordResetOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        passwordResetVerified: true,
        isEmailVerified: true
      });
      await user.save();
      userId = user._id.toString();
      resetOTP = user.passwordResetOTP;
    });

    it('should reset password with correct OTP and matching passwords', async () => {
      // First verify the OTP to get resetToken
      const verifyReq = mockRequest({
        email: 'test@example.com',
        otp: resetOTP
      });
      const verifyRes = mockResponse();
      await verifyPasswordResetOTP(verifyReq, verifyRes);
      const resetToken = verifyRes.responseData.resetToken;

      const req = mockRequest({
        resetToken,
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      });
      const res = mockResponse();

      await resetPassword(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.status).toBe('success');
      expect(res.responseData.message).toBe('Password reset successfully');

      // Verify user was updated
      const user = await User.findById(userId);
      expect(user.passwordResetOTP).toBeUndefined();
      expect(user.passwordResetVerified).toBeUndefined();
    });

    it('should reject password reset with mismatched passwords', async () => {
      // First verify the OTP to get resetToken
      const verifyReq = mockRequest({
        email: 'test@example.com',
        otp: resetOTP
      });
      const verifyRes = mockResponse();
      await verifyPasswordResetOTP(verifyReq, verifyRes);
      const resetToken = verifyRes.responseData.resetToken;

      const req = mockRequest({
        resetToken,
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      });
      const res = mockResponse();

      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Passwords do not match');
    });

    it('should reject password reset with unverified OTP', async () => {
      // Update user to have unverified OTP
      await User.findByIdAndUpdate(userId, { passwordResetVerified: false });

      const req = mockRequest({
        email: 'test@example.com',
        otp: resetOTP,
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      });
      const res = mockResponse();

      await resetPassword(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.status).toBe('fail');
      expect(res.responseData.message).toBe('Please provide reset token, new password, and confirm password');
    });
  });
});
