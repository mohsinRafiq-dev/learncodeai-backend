// Business logic tests for Authentication
import User from '../../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('Authentication Business Rules', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  it('should require email verification before login', async () => {
    // Arrange: create unverified user
    const user = new User({
      name: 'Test User',
      email: 'unverified@example.com',
      password: 'password123',
      isEmailVerified: false,
      accountStatus: 'pending'
    });
    await user.save();

    // Act: attempt to find user for login (simulate login check)
    const foundUser = await User.findOne({ email: 'unverified@example.com' }).select('+password');

    // Assert: user exists but is not verified
    expect(foundUser).toBeTruthy();
    expect(foundUser.isEmailVerified).toBe(false);
    expect(foundUser.accountStatus).toBe('pending');
  });

  it('should enforce password length >= 6', async () => {
    // Arrange: try to create user with short password
    const shortPasswordUser = {
      name: 'Test User',
      email: 'shortpass@example.com',
      password: '123', // Too short
      isEmailVerified: true,
      accountStatus: 'active'
    };

    // Act & Assert: should fail validation
    await expect(User.create(shortPasswordUser)).rejects.toThrow();

    // Arrange: try with valid password
    const validPasswordUser = {
      name: 'Test User',
      email: 'validpass@example.com',
      password: 'password123', // Valid length
      isEmailVerified: true,
      accountStatus: 'active'
    };

    // Act: create user with valid password
    const createdUser = await User.create(validPasswordUser);

    // Assert: user created successfully
    expect(createdUser).toBeTruthy();
    expect(createdUser.password).not.toBe('password123'); // Should be hashed
  });

  it('should handle OAuth login flow', async () => {
    // Arrange: create user with OAuth data
    const oauthUser = new User({
      name: 'OAuth User',
      email: 'oauth@example.com',
      googleId: 'google123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await oauthUser.save();

    // Act: find user by OAuth ID
    const foundUser = await User.findOne({ googleId: 'google123' });

    // Assert: user found with OAuth data
    expect(foundUser).toBeTruthy();
    expect(foundUser.googleId).toBe('google123');
    expect(foundUser.isEmailVerified).toBe(true);
  });

  it('should prevent duplicate email registration', async () => {
    // Arrange: create first user
    const user1 = await User.create({
      name: 'User One',
      email: 'duplicate@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    // Act & Assert: try to create second user with same email
    await expect(User.create({
      name: 'User Two',
      email: 'duplicate@example.com',
      password: 'password456',
      isEmailVerified: true,
      accountStatus: 'active'
    })).rejects.toThrow();

    // Assert: only one user exists
    const users = await User.find({ email: 'duplicate@example.com' });
    expect(users).toHaveLength(1);
  });

  it('should handle account suspension', async () => {
    // Arrange: create suspended user
    const suspendedUser = await User.create({
      name: 'Suspended User',
      email: 'suspended@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'suspended'
    });

    // Act: check account status
    const foundUser = await User.findOne({ email: 'suspended@example.com' });

    // Assert: user is suspended
    expect(foundUser.accountStatus).toBe('suspended');
  });
});
