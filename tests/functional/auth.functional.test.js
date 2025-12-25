// Functional tests for Authentication - End-to-End Workflows
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Authentication Functional Tests', () => {
  let testUser;
  let verificationOTP;

  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: /test.*@example\.com/ });
  });

  afterEach(async () => {
    // Clean up test users
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  it('should complete full user registration and login flow', async () => {
    // Step 1: Register a new user
    const userData = {
      name: 'Functional Test User',
      email: 'functionaltest@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    expect(signupResponse.body.status).toBe('success');
    expect(signupResponse.body.token).toBeDefined();
    expect(signupResponse.body.data.user).toBeDefined();

    // Get the user from database - should be auto-verified
    testUser = await User.findOne({ email: userData.email });
    expect(testUser).toBeTruthy();
    expect(testUser.isEmailVerified).toBe(true);
    expect(testUser.accountStatus).toBe('active');

    // Step 3: Login with verified account
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body.status).toBe('success');
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.data.user.email).toBe(userData.email);
    expect(loginResponse.body.data.user.name).toBe(userData.name);

    // Step 4: Access protected route with token
    const protectedResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(protectedResponse.body.status).toBe('success');
    expect(protectedResponse.body.data.user.email).toBe(userData.email);
  });

  it('should handle password reset from start to finish', async () => {
    // First create and verify a user
    const userData = {
      name: 'Password Reset User',
      email: 'passwordreset@example.com',
      password: 'oldpassword123',
      confirmPassword: 'oldpassword123'
    };

    // Signup
    await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    testUser = await User.findOne({ email: userData.email });

    // Step 1: Request password reset
    const resetRequestResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: userData.email })
      .expect(200);

    expect(resetRequestResponse.body.status).toBe('success');

    // Get reset OTP from user
    const userWithResetOTP = await User.findById(testUser._id);
    const resetOTP = userWithResetOTP.passwordResetOTP;
    expect(resetOTP).toBeDefined();

    // Step 2: Verify reset OTP
    const verifyResetResponse = await request(app)
      .post('/api/auth/verify-reset-otp')
      .send({
        email: userData.email,
        otp: resetOTP
      })
      .expect(200);

    expect(verifyResetResponse.body.status).toBe('success');
    const resetToken = verifyResetResponse.body.resetToken;
    expect(resetToken).toBeDefined();

    // Step 3: Reset password
    const newPassword = 'newpassword123';
    const resetPasswordResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        resetToken: resetToken,
        newPassword: newPassword,
        confirmPassword: newPassword
      })
      .expect(200);

    expect(resetPasswordResponse.body.status).toBe('success');
    expect(resetPasswordResponse.body.token).toBeDefined();

    // Step 4: Login with new password
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: userData.email,
        password: newPassword
      })
      .expect(200);

    expect(loginResponse.body.status).toBe('success');
    expect(loginResponse.body.token).toBeDefined();
  });

  it('should maintain session across requests', async () => {
    // Create and verify user
    const userData = {
      name: 'Session Test User',
      email: 'sessiontest@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    // Login and get token (auto-verified)
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    const token = loginResponse.body.token;

    // Make multiple requests with the same token
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(userData.email);
    }
  });

  it('should handle logout properly', async () => {
    // Create and verify user
    const userData = {
      name: 'Logout Test User',
      email: 'logouttest@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    // Login (auto-verified)
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    const token = loginResponse.body.token;

    // Verify token works before logout
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Logout
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(logoutResponse.body.status).toBe('success');

    // Verify logout response (JWT tokens remain valid until expiry)
    // Note: Current implementation uses cookie-based logout, JWT tokens are stateless
  });

  it('should handle concurrent login attempts', async () => {
    // Create and verify user
    const userData = {
      name: 'Concurrent Test User',
      email: 'concurrenttest@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    // Attempt multiple concurrent logins (auto-verified)
    const loginPromises = [];
    for (let i = 0; i < 5; i++) {
      loginPromises.push(
        request(app)
          .post('/api/auth/signin')
          .send({
            email: userData.email,
            password: userData.password
          })
      );
    }

    const responses = await Promise.all(loginPromises);

    // All should succeed (JWT is stateless)
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();
    });

    // All tokens should work independently
    const tokenPromises = responses.map(response =>
      request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${response.body.token}`)
    );

    const tokenResponses = await Promise.all(tokenPromises);
    tokenResponses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(userData.email);
    });
  });
});
