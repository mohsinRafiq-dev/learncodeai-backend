// Unit tests for User Model
import User from '../../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        isEmailVerified: true,
        role: 'user',
        accountStatus: 'active'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe('John Doe');
      expect(savedUser.email).toBe('john@example.com');
      expect(savedUser.role).toBe('user');
      expect(savedUser.accountStatus).toBe('active');
      expect(savedUser.isEmailVerified).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require name', async () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow(/Name is required/);
    });

    it('should require email', async () => {
      const user = new User({
        name: 'John Doe',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow(/Email is required/);
    });

    it('should require password for non-OAuth users', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      await expect(user.save()).rejects.toThrow(/Path `password` is required/);
    });

    it('should not require password for OAuth users', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        googleId: '123456789'
      });

      const savedUser = await user.save();
      expect(savedUser.googleId).toBe('123456789');
    });

    it('should validate email format', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow(/Please provide a valid email/);
    });

    it('should enforce unique email', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const user2 = new User({
        name: 'Jane Doe',
        email: 'john@example.com',
        password: 'password456'
      });

      await expect(user2.save()).rejects.toThrow(/duplicate key error/);
    });

    it('should enforce name length constraints', async () => {
      const shortNameUser = new User({
        name: 'A',
        email: 'john@example.com',
        password: 'password123'
      });

      const longNameUser = new User({
        name: 'A'.repeat(51),
        email: 'jane@example.com',
        password: 'password123'
      });

      await expect(shortNameUser.save()).rejects.toThrow(/Name must be at least 2 characters long/);
      await expect(longNameUser.save()).rejects.toThrow(/Name cannot be more than 50 characters long/);
    });

    it('should enforce password minimum length', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      });

      await expect(user.save()).rejects.toThrow(/Password must be at least 6 characters long/);
    });

    it('should validate role enum', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'superuser'
      });

      await expect(user.save()).rejects.toThrow(/not a valid enum value/);
    });

    it('should validate accountStatus enum', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        accountStatus: 'banned'
      });

      await expect(user.save()).rejects.toThrow(/not a valid enum value/);
    });

    it('should validate experience enum', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        experience: 'novice'
      });

      await expect(user.save()).rejects.toThrow(/not a valid enum value/);
    });

    it('should enforce bio length limit', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        bio: 'A'.repeat(501)
      });

      await expect(user.save()).rejects.toThrow(/Bio cannot exceed 500 characters/);
    });

    it('should enforce location length limit', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'A'.repeat(101)
      });

      await expect(user.save()).rejects.toThrow(/Location cannot exceed 100 characters/);
    });

    it('should set default values', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();

      expect(savedUser.role).toBe('user');
      expect(savedUser.accountStatus).toBe('pending');
      expect(savedUser.isEmailVerified).toBe(false);
      expect(savedUser.isProfileComplete).toBe(false);
      expect(savedUser.preferences.emailNotifications).toBe(true);
    });
  });

  describe('Password Hashing Middleware', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();

      expect(savedUser.password).not.toBe('password123');
      expect(savedUser.password).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const originalHash = user.password;
      user.name = 'Jane Doe';
      await user.save();

      expect(user.password).toBe(originalHash);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        isEmailVerified: false,
        accountStatus: 'pending'
      });
    });

    describe('correctPassword', () => {
      it('should return true for correct password', async () => {
        const isCorrect = await user.correctPassword('password123', user.password);
        expect(isCorrect).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isCorrect = await user.correctPassword('wrongpassword', user.password);
        expect(isCorrect).toBe(false);
      });
    });

    describe('updateLastLogin', () => {
      it('should update lastLogin timestamp', async () => {
        const beforeUpdate = user.lastLogin;
        await user.updateLastLogin();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.lastLogin).toBeDefined();
        expect(updatedUser.lastLogin).not.toBe(beforeUpdate);
      });
    });

    describe('Email Verification OTP Methods', () => {
      it('should set email verification OTP', async () => {
        await user.setEmailVerificationOTP('123456');

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.emailVerificationOTP).toBe('123456');
        expect(updatedUser.emailVerificationOTPExpires).toBeDefined();
        expect(updatedUser.emailVerificationOTPExpires.getTime()).toBeGreaterThan(Date.now());
      });

      it('should verify correct OTP', async () => {
        await user.setEmailVerificationOTP('123456');

        const isValid = user.verifyEmailOTP('123456');
        expect(isValid).toBe(true);
      });

      it('should reject incorrect OTP', async () => {
        await user.setEmailVerificationOTP('123456');

        const isValid = user.verifyEmailOTP('654321');
        expect(isValid).toBe(false);
      });

      it('should reject expired OTP', async () => {
        // Set OTP with past expiration
        user.emailVerificationOTP = '123456';
        user.emailVerificationOTPExpires = new Date(Date.now() - 1000);
        await user.save({ validateBeforeSave: false });

        const isValid = user.verifyEmailOTP('123456');
        expect(isValid).toBe(false);
      });

      it('should clear email verification OTP and mark as verified', async () => {
        await user.setEmailVerificationOTP('123456');

        await user.clearEmailVerificationOTP();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.emailVerificationOTP).toBeNull();
        expect(updatedUser.emailVerificationOTPExpires).toBeNull();
        expect(updatedUser.isEmailVerified).toBe(true);
        expect(updatedUser.accountStatus).toBe('active');
      });

      it('should not change account status if not pending', async () => {
        user.accountStatus = 'suspended';
        await user.save({ validateBeforeSave: false });

        await user.setEmailVerificationOTP('123456');
        await user.clearEmailVerificationOTP();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.accountStatus).toBe('suspended');
      });
    });

    describe('Password Reset OTP Methods', () => {
      it('should set password reset OTP', async () => {
        await user.setPasswordResetOTP('123456');

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.passwordResetOTP).toBe('123456');
        expect(updatedUser.passwordResetOTPExpires).toBeDefined();
        expect(updatedUser.passwordResetOTPExpires.getTime()).toBeGreaterThan(Date.now());
      });

      it('should verify correct password reset OTP', async () => {
        await user.setPasswordResetOTP('123456');

        const isValid = user.verifyPasswordResetOTP('123456');
        expect(isValid).toBe(true);
      });

      it('should reject incorrect password reset OTP', async () => {
        await user.setPasswordResetOTP('123456');

        const isValid = user.verifyPasswordResetOTP('654321');
        expect(isValid).toBe(false);
      });

      it('should reject expired password reset OTP', async () => {
        // Set OTP with past expiration
        user.passwordResetOTP = '123456';
        user.passwordResetOTPExpires = new Date(Date.now() - 1000);
        await user.save({ validateBeforeSave: false });

        const isValid = user.verifyPasswordResetOTP('123456');
        expect(isValid).toBe(false);
      });

      it('should clear password reset OTP', async () => {
        await user.setPasswordResetOTP('123456');

        await user.clearPasswordResetOTP();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.passwordResetOTP).toBeNull();
        expect(updatedUser.passwordResetOTPExpires).toBeNull();
      });
    });
  });

  describe('Profile and Preferences', () => {
    it('should save profile information', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        bio: 'Software developer',
        location: 'New York',
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
        website: 'https://johndoe.com',
        programmingLanguages: ['JavaScript', 'Python'],
        skills: ['React', 'Node.js'],
        interests: ['AI', 'Web Development'],
        experience: 'intermediate'
      });

      const savedUser = await user.save();

      expect(savedUser.bio).toBe('Software developer');
      expect(savedUser.location).toBe('New York');
      expect(savedUser.github).toBe('https://github.com/johndoe');
      expect(savedUser.programmingLanguages).toEqual(['JavaScript', 'Python']);
      expect(savedUser.skills).toEqual(['React', 'Node.js']);
      expect(savedUser.interests).toEqual(['AI', 'Web Development']);
      expect(savedUser.experience).toBe('intermediate');
    });

    it('should save preferences', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        preferences: {
          emailNotifications: false
        }
      });

      const savedUser = await user.save();
      expect(savedUser.preferences.emailNotifications).toBe(false);
    });
  });

  describe('OAuth Integration', () => {
    it('should create user with Google ID', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        googleId: '123456789'
      });

      const savedUser = await user.save();
      expect(savedUser.googleId).toBe('123456789');
      expect(savedUser.password).toBeUndefined(); // Password not required for OAuth
    });

    it('should create user with GitHub ID', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        githubId: '987654321'
      });

      const savedUser = await user.save();
      expect(savedUser.githubId).toBe('987654321');
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt timestamps', async () => {
      const beforeCreate = new Date();
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });

    it('should update updatedAt on save', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const originalUpdatedAt = user.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      user.name = 'Jane Doe';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});