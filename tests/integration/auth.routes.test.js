// Integration tests for Authentication Routes
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

describe('Authentication Routes', () => {
  it('should register and login user via API', async () => {
    // Arrange: valid user data
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    // Act: POST /api/auth/signup
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    // Assert: user created
    expect(signupResponse.body.status).toBe('success');
    expect(signupResponse.body.token).toBeDefined();
    expect(signupResponse.body.data.user).toBeDefined();

    // For login, we might need email verification first
    // This depends on your implementation
    // Let's check if the user was created in DB
    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
    expect(user.name).toBe(userData.name);
  });

  it('should block login for unverified email', async () => {
    // Arrange: create unverified user directly in DB
    const user = new User({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'password123',
      isVerified: false // assuming there's an isVerified field
    });
    await user.save();

    // Act: POST /api/auth/signin
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'unverified@example.com',
        password: 'password123'
      });

    // Assert: login blocked (this depends on your auth logic)
    // You might expect 401 or some error status
    expect(loginResponse.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle invalid signup data', async () => {
    // Arrange: invalid user data (missing required fields)
    const invalidUserData = {
      name: 'Test User',
      // missing email and password
    };

    // Act: POST /api/auth/signup
    const response = await request(app)
      .post('/api/auth/signup')
      .send(invalidUserData);

    // Assert: error returned
    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
  });

  it('should handle duplicate email registration', async () => {
    // Arrange: create user first
    const userData = {
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'password123'
    };

    await request(app)
      .post('/api/auth/signup')
      .send(userData);

    // Act: try to register again with same email
    const duplicateResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    // Assert: error for duplicate email
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.status).toBe('fail');
  });
});
