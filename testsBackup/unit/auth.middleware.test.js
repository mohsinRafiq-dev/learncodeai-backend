import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { protect } from '../../src/controllers/authController.js';
import User from '../../src/models/User.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware Tests', () => {
  let req, res, next;
  let mockUser;
  let jwtVerifySpy;

  beforeEach(async () => {
    // Clear all users
    await User.deleteMany({});
    
    // Create mock user
    mockUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true,
    });

    // Mock request, response, and next function
    req = {
      headers: {},
      cookies: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    next = jest.fn();

    // Setup JWT spy
    jwtVerifySpy = jest.spyOn(jwt, 'verify');

    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('should allow access with valid token in header', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      // Mock jwt.verify to return user id
      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(jwtVerifySpy).toHaveBeenCalledWith(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(mockUser._id.toString());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access with valid token in cookie', async () => {
      const token = 'valid-jwt-token';
      req.cookies.jwt = token;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(jwtVerifySpy).toHaveBeenCalledWith(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(mockUser._id.toString());
      expect(next).toHaveBeenCalled();
    });

    test('should reject request with no token', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      const token = 'invalid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with expired token', async () => {
      const token = 'expired-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwtVerifySpy.mockImplementation(() => {
        throw expiredError;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request if user no longer exists', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      // Mock jwt.verify to return non-existent user id
      jwtVerifySpy.mockReturnValue({ id: '507f1f77bcf86cd799439011' });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle authorization header without Bearer', async () => {
      req.headers.authorization = 'some-token';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    });

    test('should prioritize header token over cookie token', async () => {
      const headerToken = 'header-token';
      const cookieToken = 'cookie-token';
      
      req.headers.authorization = `Bearer ${headerToken}`;
      req.cookies.jwt = cookieToken;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(jwtVerifySpy).toHaveBeenCalledWith(headerToken, expect.any(String));
      expect(next).toHaveBeenCalled();
    });

    test('should handle database error when finding user', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: 'invalid-object-id' });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should set correct user properties on request', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.name).toBe(mockUser.name);
      expect(req.user.email).toBe(mockUser.email);
      expect(req.user.role).toBe(mockUser.role);
      expect(req.user.isEmailVerified).toBe(mockUser.isEmailVerified);
      expect(req.user.password).toBeUndefined(); // Should not include password
    });

    test('should handle JWT malformed error', async () => {
      const token = 'malformed-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      const malformedError = new Error('Malformed token');
      malformedError.name = 'JsonWebTokenError';
      jwtVerifySpy.mockImplementation(() => {
        throw malformedError;
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
    });

    test('should handle empty token string', async () => {
      req.headers.authorization = 'Bearer ';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    });

    test('should handle whitespace-only token', async () => {
      req.headers.authorization = 'Bearer    ';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    });
  });

  describe('Token extraction', () => {
    test('should extract token from Authorization header correctly', async () => {
      const token = 'test-token-12345';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(jwtVerifySpy).toHaveBeenCalledWith(token, expect.any(String));
    });

    test('should extract token from cookie correctly', async () => {
      const token = 'test-cookie-token-67890';
      req.cookies.jwt = token;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      await protect(req, res, next);

      expect(jwtVerifySpy).toHaveBeenCalledWith(token, expect.any(String));
    });

    test('should handle missing authorization header and cookie', async () => {
      // No authorization header and no cookie
      await protect(req, res, next);

      expect(jwtVerifySpy).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Error handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      // Mock an unexpected error during token verification
      jwtVerifySpy.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });
    });

    test('should handle User.findById throwing an error', async () => {
      const token = 'valid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: mockUser._id.toString() });

      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid token. Please log in again!',
      });

      // Restore original method
      User.findById = originalFindById;
    });
  });

  describe('Integration with different user states', () => {
    test('should work with admin user', async () => {
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        isEmailVerified: true,
        role: 'admin',
      });

      const token = 'admin-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: adminUser._id.toString() });

      await protect(req, res, next);

      expect(req.user.role).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    test('should work with unverified user', async () => {
      const unverifiedUser = await User.create({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
      });

      const token = 'unverified-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: unverifiedUser._id.toString() });

      await protect(req, res, next);

      expect(req.user.isEmailVerified).toBe(false);
      expect(next).toHaveBeenCalled(); // Middleware should still allow access, verification check is route-specific
    });

    test('should work with OAuth user', async () => {
      const oauthUser = await User.create({
        name: 'OAuth User',
        email: 'oauth@example.com',
        googleId: 'google123',
        isEmailVerified: true,
      });

      const token = 'oauth-token';
      req.headers.authorization = `Bearer ${token}`;

      jwtVerifySpy.mockReturnValue({ id: oauthUser._id.toString() });

      await protect(req, res, next);

      expect(req.user.googleId).toBe('google123');
      expect(req.user.password).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
