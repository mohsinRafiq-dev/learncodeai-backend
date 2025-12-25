// Integration tests for Failed Login Attempts feature in Authentication Routes
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Failed Login Attempts Integration Tests', () => {
  let testUser;

  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: 'failedlogin@example.com' });
    
    // Create a verified test user
    testUser = await User.create({
      name: 'Failed Login Test User',
      email: 'failedlogin@example.com',
      password: 'correctpassword123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
  });

  afterEach(async () => {
    // Clean up test users
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  it('should allow successful login and reset failed attempts', async () => {
    // First, make a few failed attempts
    await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    // Verify failed attempts were recorded
    const userAfterFailed = await User.findOne({ email: 'failedlogin@example.com' });
    expect(userAfterFailed.failedLoginAttempts).toBe(2);

    // Now login with correct password
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'correctpassword123'
      })
      .expect(200);

    expect(loginResponse.body.status).toBe('success');
    expect(loginResponse.body.token).toBeDefined();

    // Verify failed attempts were reset
    const userAfterSuccess = await User.findOne({ email: 'failedlogin@example.com' });
    expect(userAfterSuccess.failedLoginAttempts).toBe(0);
    expect(userAfterSuccess.lastFailedLogin).toBeNull();
    expect(userAfterSuccess.accountLockedUntil).toBeNull();
  });

  it('should track failed login attempts and show remaining attempts', async () => {
    // First failed attempt
    const response1 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response1.body.status).toBe('fail');
    expect(response1.body.message).toContain('4 attempts remaining');
    expect(response1.body.attemptsRemaining).toBe(4);

    // Second failed attempt
    const response2 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response2.body.message).toContain('3 attempts remaining');
    expect(response2.body.attemptsRemaining).toBe(3);

    // Third failed attempt
    const response3 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response3.body.message).toContain('2 attempts remaining');
    expect(response3.body.attemptsRemaining).toBe(2);

    // Fourth failed attempt
    const response4 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response4.body.message).toContain('1 attempts remaining');
    expect(response4.body.attemptsRemaining).toBe(1);
  });

  it('should lock account after 5 failed login attempts', async () => {
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'failedlogin@example.com',
          password: 'wrongpassword'
        });
    }

    // The 5th attempt should return account locked response
    const response5 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'wrongpassword'
      })
      .expect(423);

    expect(response5.body.status).toBe('fail');
    expect(response5.body.message).toContain('temporarily locked');
    expect(response5.body.accountLocked).toBe(true);
    expect(response5.body.lockTimeRemaining).toBe(30);

    // Verify that even with correct password, login is blocked while locked
    const correctPasswordResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'correctpassword123'
      })
      .expect(423);

    expect(correctPasswordResponse.body.status).toBe('fail');
    expect(correctPasswordResponse.body.message).toContain('Account temporarily locked');
    expect(correctPasswordResponse.body.accountLocked).toBe(true);
  });

  // Note: Testing protected routes with locked accounts is covered in unit tests
  // as integration testing JWT mocking is complex

  it('should allow login after lock period expires', async () => {
    // Set account to be locked but with past expiration time
    testUser.accountLockedUntil = new Date(Date.now() - 1000); // 1 second ago
    testUser.failedLoginAttempts = 5;
    await testUser.save();

    // Should be able to login now with correct password
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'failedlogin@example.com',
        password: 'correctpassword123'
      })
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();

    // Failed attempts should be reset
    const userAfterLogin = await User.findOne({ email: 'failedlogin@example.com' });
    expect(userAfterLogin.failedLoginAttempts).toBe(0);
  });

  it('should handle non-existent user gracefully without tracking attempts', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      })
      .expect(401);

    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('Incorrect email or password');
    // Should not contain attempt tracking information
    expect(response.body.attemptsRemaining).toBeUndefined();
  });
});