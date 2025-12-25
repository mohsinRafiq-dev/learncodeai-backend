// Unit tests for Failed Login Attempts feature
import User from '../../src/models/User.js';

describe('Failed Login Attempts', () => {
  let testUser;

  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ email: 'test@example.com' });
    
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
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

  describe('User Model Methods', () => {
    it('should initially have no failed login attempts', () => {
      expect(testUser.failedLoginAttempts).toBe(0);
      expect(testUser.lastFailedLogin).toBeNull();
      expect(testUser.accountLockedUntil).toBeNull();
      expect(testUser.isAccountLocked()).toBe(false);
    });

    it('should increment failed login attempts', async () => {
      await testUser.incrementFailedAttempts();
      
      expect(testUser.failedLoginAttempts).toBe(1);
      expect(testUser.lastFailedLogin).toBeDefined();
      expect(testUser.accountLockedUntil).toBeNull(); // Not locked after 1 attempt
      expect(testUser.isAccountLocked()).toBe(false);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await testUser.incrementFailedAttempts();
      }
      
      expect(testUser.failedLoginAttempts).toBe(5);
      expect(testUser.accountLockedUntil).toBeDefined();
      expect(testUser.isAccountLocked()).toBe(true);
      
      // Should be locked for 30 minutes
      const lockDuration = testUser.accountLockedUntil - Date.now();
      expect(lockDuration).toBeGreaterThan(29 * 60 * 1000); // ~29 minutes
      expect(lockDuration).toBeLessThan(31 * 60 * 1000); // ~31 minutes
    });

    it('should reset failed attempts', async () => {
      // Add some failed attempts first
      await testUser.incrementFailedAttempts();
      await testUser.incrementFailedAttempts();
      
      expect(testUser.failedLoginAttempts).toBe(2);
      
      // Reset attempts
      await testUser.resetFailedAttempts();
      
      expect(testUser.failedLoginAttempts).toBe(0);
      expect(testUser.lastFailedLogin).toBeNull();
      expect(testUser.accountLockedUntil).toBeNull();
      expect(testUser.isAccountLocked()).toBe(false);
    });

    it('should reset failed attempts after 2 hours', async () => {
      // Simulate old failed attempt (more than 2 hours ago)
      testUser.lastFailedLogin = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      testUser.failedLoginAttempts = 3;
      await testUser.save();
      
      // New failed attempt should reset the counter
      await testUser.incrementFailedAttempts();
      
      expect(testUser.failedLoginAttempts).toBe(1); // Reset to 1, not 4
    });

    it('should detect if account is locked', () => {
      // Set account to be locked for 10 minutes from now
      testUser.accountLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      expect(testUser.isAccountLocked()).toBe(true);
      
      // Set account lock to past time
      testUser.accountLockedUntil = new Date(Date.now() - 10 * 60 * 1000);
      expect(testUser.isAccountLocked()).toBe(false);
      
      // No lock set
      testUser.accountLockedUntil = null;
      expect(testUser.isAccountLocked()).toBe(false);
    });
  });
});