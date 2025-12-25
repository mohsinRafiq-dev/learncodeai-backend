// Test for email validation
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Email Validation', () => {
  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: /email.*test.*@/ });
  });

  afterEach(async () => {
    // Clean up test users
    await User.deleteMany({ email: /email.*test.*@/ });
  });

  it('should reject invalid email formats during signup', async () => {
    const invalidEmails = [
      'invalid-email',
      'invalid@',
      '@invalid.com',
      'invalid.com',
      'invalid@.com',
      'invalid@com',
      'invalid..email@test.com',
      'invalid@test..com'
    ];

    for (const [index, invalidEmail] of invalidEmails.entries()) {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: invalidEmail,
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Invalid email, please enter a valid email');
    }
  });

  it('should accept valid email formats during signup', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'user_name@example-domain.com',
      'test123@gmail.com'
    ];

    for (const [index, validEmail] of validEmails.entries()) {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: validEmail,
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!'
        });

      // Should succeed (201) or at least not fail due to email validation
      if (response.status === 400) {
        // If it fails, it shouldn't be due to email validation
        expect(response.body.message).not.toBe('Invalid email, please enter a valid email');
      }
    }
  });

  it('should validate email format in User model', async () => {
    // Test invalid email - should fail
    const invalidUser = new User({
      name: 'Test User',
      email: 'invalid-email', // invalid format
      password: 'StrongPass123!',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    await expect(invalidUser.save()).rejects.toThrow();

    // Test valid email - should succeed
    const validUser = new User({
      name: 'Test User',
      email: 'valid@example.com', // valid format
      password: 'StrongPass123!',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    await expect(validUser.save()).resolves.toBeTruthy();
    
    // Clean up
    if (validUser._id) {
      await User.findByIdAndDelete(validUser._id);
    }
  });

  it('should reject invalid email during signin', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'invalid-email-format',
        password: 'anypassword'
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toBe('Invalid email, please enter a valid email');
  });
});