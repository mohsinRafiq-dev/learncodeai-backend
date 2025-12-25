// Quick test to verify locked account behavior with correct password
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Account Lock with Correct Password', () => {
  let testUser;

  beforeAll(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: 'locktest@example.com' });
    
    // Create a test user
    testUser = await User.create({
      name: 'Lock Test User',
      email: 'locktest@example.com',
      password: 'correctpassword',
      isEmailVerified: true,
      accountStatus: 'active'
    });
  });

  afterAll(async () => {
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  test('should allow login with correct password after lock expires', async () => {
    // Manually set account as locked but with past expiration
    testUser.failedLoginAttempts = 5;
    testUser.accountLockedUntil = new Date(Date.now() - 1000); // Expired 1 second ago
    testUser.lastFailedLogin = new Date();
    await testUser.save();

    // Should be able to login with correct password
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'locktest@example.com',
        password: 'correctpassword'
      })
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.token).toBeDefined();

    // Verify lock and failed attempts are cleared
    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.failedLoginAttempts).toBe(0);
    expect(updatedUser.accountLockedUntil).toBeNull();
    expect(updatedUser.lastFailedLogin).toBeNull();
  });

  test('should still block login with wrong password when account is locked', async () => {
    // Set account as locked with future expiration
    testUser.failedLoginAttempts = 5;
    testUser.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    testUser.lastFailedLogin = new Date();
    await testUser.save();

    // Should be blocked even with wrong password
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'locktest@example.com',
        password: 'wrongpassword'
      })
      .expect(423);

    expect(response.body.status).toBe('fail');
    expect(response.body.accountLocked).toBe(true);
    expect(response.body.message).toContain('temporarily locked');
  });
});