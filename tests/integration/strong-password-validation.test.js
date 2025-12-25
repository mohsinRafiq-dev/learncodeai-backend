// Test for strong password validation
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Strong Password Validation', () => {
  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: /strongpass.*@example\.com/ });
  });

  afterEach(async () => {
    // Clean up test users
    await User.deleteMany({ email: /strongpass.*@example\.com/ });
  });

  it('should reject weak passwords during signup', async () => {
    const weakPasswords = [
      'password',      // no uppercase, no number, no special char
      'Password',      // no number, no special char
      'Password123',   // no special char
      'password123!',  // no uppercase
      'PASSWORD123!',  // no lowercase
      'Pass123!',      // too short (7 chars)
    ];

    for (const [index, weakPassword] of weakPasswords.entries()) {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: `strongpass${index}@example.com`,
          password: weakPassword,
          confirmPassword: weakPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Password must be at least 8 characters long');
    }
  });

  it('should accept strong passwords during signup', async () => {
    const strongPasswords = [
      'Password123!',
      'MyStr0ng@Pass',
      'Secure2024$',
      'Complex&Pass1'
    ];

    for (const [index, strongPassword] of strongPasswords.entries()) {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: `strongpass-good${index}@example.com`,
          password: strongPassword,
          confirmPassword: strongPassword
        });

      // Should succeed (201) or at least not fail due to password validation
      expect(response.status).not.toBe(400);
      if (response.status === 400) {
        // If it fails, it shouldn't be due to password validation
        expect(response.body.message).not.toContain('Password must be at least 8 characters long');
      }
    }
  });

  it('should validate password strength in User model', async () => {
    // Test weak password - should fail
    const weakUser = new User({
      name: 'Test User',
      email: 'weakuser@example.com',
      password: 'weakpass', // doesn't meet requirements
      isEmailVerified: true,
      accountStatus: 'active'
    });

    await expect(weakUser.save()).rejects.toThrow();

    // Test strong password - should succeed
    const strongUser = new User({
      name: 'Test User',
      email: 'stronguser@example.com',
      password: 'StrongPass123!', // meets all requirements
      isEmailVerified: true,
      accountStatus: 'active'
    });

    await expect(strongUser.save()).resolves.toBeTruthy();
    
    // Clean up
    if (strongUser._id) {
      await User.findByIdAndDelete(strongUser._id);
    }
  });
});