import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import User from '../../src/models/User.js';
import authRoutes from '../../src/routes/authRoutes.js';
import codeExecutionRoutes from '../../src/routes/codeExecutionRoutes.js';
import emailService from '../../src/services/emailService.js';
import codeExecutorService from '../../src/services/codeExecutorService.js';
import passport from '../../src/config/passport.js';

// Create full app simulation
const createApp = () => {
  const app = express();
  
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  
  app.use(session({
    secret: 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/code', codeExecutionRoutes);
  
  return app;
};

describe('End-to-End Integration Tests', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    await User.deleteMany({});
    jest.clearAllMocks();
    
    // Setup mocks for email service
    jest.spyOn(emailService, 'initialize').mockResolvedValue(true);
    jest.spyOn(emailService, 'isAvailable').mockReturnValue(true);
    jest.spyOn(emailService, 'sendVerificationOTP').mockResolvedValue({ success: true, messageId: 'test-id' });
    jest.spyOn(emailService, 'sendPasswordResetOTP').mockResolvedValue({ success: true, messageId: 'test-id' });
    jest.spyOn(emailService, 'generateOTP').mockReturnValue('123456');
    
    // Setup default mock for code execution
    jest.spyOn(codeExecutorService, 'executeCode').mockResolvedValue({
      output: 'Hello, World!',
      executionTime: 100,
      memoryUsage: 50,
    });
  });

  describe('Complete User Registration and Login Flow', () => {
    test('should complete full user journey: register -> verify -> login -> use app', async () => {
      const userData = {
        name: 'E2E Test User',
        email: 'e2e@example.com',
        password: 'testpassword123',
        confirmPassword: 'testpassword123',
      };

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.status).toBe('success');
      expect(registerResponse.body.message).toContain('Please check your email');

      // Step 2: Verify that user was created but not verified
      let user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.isEmailVerified).toBe(false);

      // Step 3: Attempt login with unverified account (should fail)
      const unverifiedLoginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(401);

      expect(unverifiedLoginResponse.body.message).toContain('not verified');

      // Step 4: Verify email with OTP
      await user.setEmailVerificationOTP('123456');

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: userData.email, otp: '123456' })
        .expect(200);

      expect(verifyResponse.body.status).toBe('success');
      expect(verifyResponse.body.token).toBeDefined();

      // Step 5: Login with verified account
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

      const authToken = loginResponse.body.token;

      // Step 6: Access protected route (user profile)
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.status).toBe('success');
      expect(profileResponse.body.data.user.email).toBe(userData.email);

      // Step 7: Execute code with authenticated session
      const codeResponse = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print("Hello from authenticated user!")',
          language: 'python',
        })
        .expect(200);

      expect(codeResponse.body.success).toBe(true);
      expect(codeResponse.body.data.output).toBeDefined();

      // Step 8: Get supported languages
      const languagesResponse = await request(app)
        .get('/api/code/languages')
        .expect(200);

      expect(languagesResponse.body.success).toBe(true);
      expect(languagesResponse.body.data).toHaveLength(3);

      // Step 9: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.message).toBeUndefined();
    });
  });

  describe('Password Reset Flow', () => {
    test('should complete password reset journey', async () => {
      // Step 1: Create verified user
      const user = await User.create({
        name: 'Reset Test User',
        email: 'reset@example.com',
        password: 'oldpassword123',
        isEmailVerified: true,
        accountStatus: 'active',
      });

      // Step 2: Login with original password
      const originalLoginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: user.email,
          password: 'oldpassword123',
        })
        .expect(200);

      expect(originalLoginResponse.body.status).toBe('success');

      // Step 3: Request password reset
      const forgotPasswordResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      expect(forgotPasswordResponse.body.message).toContain('reset');

      // Step 4: Set and verify reset OTP to get token
      const updatedUser = await User.findById(user._id);
      await updatedUser.setPasswordResetOTP('123456');

      const otpResponse = await request(app)
        .post('/api/auth/verify-reset-otp')
        .send({ email: user.email, otp: '123456' })
        .expect(200);

      // Step 5: Reset password with token
      const resetPasswordResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: otpResponse.body.resetToken,
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
        .expect(200);

      expect(resetPasswordResponse.body.status).toBe('success');

      // Step 6: Verify old password no longer works
      await request(app)
        .post('/api/auth/signin')
        .send({
          email: user.email,
          password: 'oldpassword123',
        })
        .expect(401);

      // Step 7: Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: user.email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(newLoginResponse.body.status).toBe('success');
    });
  });

  describe('Code Execution Scenarios', () => {
    beforeEach(async () => {
      // Create and login user for code execution tests
      const user = await User.create({
        name: 'Code Test User',
        email: 'code@example.com',
        password: 'password123',
        isEmailVerified: true,
      });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });
    });

    test('should execute Python code successfully', async () => {
      codeExecutorService.executeCode.mockResolvedValue({
        output: '1\\n4\\n9\\n16\\n25',
        executionTime: 120,
        memoryUsage: 45,
      });

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'for i in range(1, 6):\\n    print(i ** 2)',
          language: 'python',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toBe('1\\n4\\n9\\n16\\n25');
    });

    test('should execute JavaScript code successfully', async () => {
      codeExecutorService.executeCode.mockResolvedValue({
        output: 'fibonacci(10) = 55',
        executionTime: 95,
        memoryUsage: 38,
      });

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: `
            function fibonacci(n) {
              if (n <= 1) return n;
              return fibonacci(n - 1) + fibonacci(n - 2);
            }
            console.log('fibonacci(10) =', fibonacci(10));
          `,
          language: 'javascript',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toBe('fibonacci(10) = 55');
    });

    test('should execute C++ code successfully', async () => {
      codeExecutorService.executeCode.mockResolvedValue({
        output: 'Hello from C++!\\nSum: 15',
        executionTime: 180,
        memoryUsage: 52,
      });

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: `
            #include <iostream>
            using namespace std;
            
            int main() {
              cout << "Hello from C++!" << endl;
              int a = 5, b = 10;
              cout << "Sum: " << (a + b) << endl;
              return 0;
            }
          `,
          language: 'cpp',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toBe('Hello from C++!\\nSum: 15');
    });

    test('should handle code execution errors gracefully', async () => {
      codeExecutorService.executeCode.mockResolvedValue({
        output: "Traceback (most recent call last): File main.py, line 1, in module print(undefined_variable) NameError: name 'undefined_variable' is not defined",
        executionTime: 75,
        memoryUsage: 40,
      });

      const response = await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print(undefined_variable)',
          language: 'python',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.output).toContain('NameError');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid authentication gracefully', async () => {
      // Try to access protected route without token
      await request(app)
        .get('/api/auth/me')
        .expect(401);

      // Try with invalid token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should handle duplicate registration attempts', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Second registration with same email (should return 200 with message about existing unverified account)
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(200);
    });

    test('should handle invalid code execution requests', async () => {
      // Missing code
      await request(app)
        .post('/api/code/execute')
        .send({ language: 'python' })
        .expect(400);

      // Unsupported language
      await request(app)
        .post('/api/code/execute')
        .send({ code: 'puts "hello"', language: 'ruby' })
        .expect(400);
    });

    test('should handle service failures gracefully', async () => {
      // Mock code executor service failure
      codeExecutorService.executeCode.mockRejectedValue(
        new Error('Docker service unavailable')
      );

      await request(app)
        .post('/api/code/execute')
        .send({
          code: 'print("test")',
          language: 'python',
        })
        .expect(500);
    });
  });

  describe('Session and Cookie Management', () => {
    test('should handle JWT cookies correctly during auth flow', async () => {
      const userData = {
        name: 'Cookie Test User',
        email: 'cookie@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Register and verify user
      await request(app).post('/api/auth/signup').send(userData);
      
      const user = await User.findOne({ email: userData.email });
      await user.setEmailVerificationOTP('123456');
      await request(app)
        .post('/api/auth/verify-email')
        .send({ email: userData.email, otp: '123456' });

      // Login and check for JWT cookie
      const loginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      const jwtCookie = cookies?.find(cookie => cookie.includes('jwt='));
      expect(jwtCookie).toBeDefined();
      expect(jwtCookie).toContain('HttpOnly');

      // Logout and check cookie is cleared
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      const logoutCookies = logoutResponse.headers['set-cookie'];
      const clearedJwtCookie = logoutCookies?.find(cookie => cookie.includes('jwt='));
      expect(clearedJwtCookie).toContain('jwt=loggedout');
    });
  });

  describe('API Response Consistency', () => {
    test('should maintain consistent response format across endpoints', async () => {
      // Check auth endpoints response format
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'format@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(signupResponse.body).toHaveProperty('status');
      expect(signupResponse.body).toHaveProperty('message');

      // Check code execution endpoints response format
      const languagesResponse = await request(app)
        .get('/api/code/languages');

      expect(languagesResponse.body).toHaveProperty('success');
      expect(languagesResponse.body).toHaveProperty('data');

      // Check error response format
      const errorResponse = await request(app)
        .post('/api/code/execute')
        .send({ language: 'invalid' });

      expect(errorResponse.body).toHaveProperty('success');
      expect(errorResponse.body).toHaveProperty('message');
    });
  });
});