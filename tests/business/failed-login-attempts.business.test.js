// Business logic tests for Failed Login Attempts
import User from '../../src/models/User.js';

describe('Failed Login Attempts Business Rules', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  it('should enforce 5-attempt lockout policy', async () => {
    // Arrange: create active user
    const user = new User({
      name: 'Test User',
      email: 'business@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await user.save();

    // Act & Assert: Test business rule progression
    
    // Attempts 1-4 should increment counter but not lock
    for (let i = 1; i <= 4; i++) {
      await user.incrementFailedAttempts();
      expect(user.failedLoginAttempts).toBe(i);
      expect(user.isAccountLocked()).toBe(false);
    }

    // 5th attempt should lock the account
    await user.incrementFailedAttempts();
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.isAccountLocked()).toBe(true);
    
    // Lock should be for 30 minutes
    const lockDuration = (user.accountLockedUntil - Date.now()) / (60 * 1000);
    expect(lockDuration).toBeCloseTo(30, 0); // Within 1 minute tolerance
  });

  it('should reset attempt counter after 2 hours of inactivity', async () => {
    // Arrange: user with old failed attempts
    const user = new User({
      name: 'Test User',
      email: 'timeout@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      failedLoginAttempts: 3,
      lastFailedLogin: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    });
    await user.save();

    // Act: new failed attempt
    await user.incrementFailedAttempts();

    // Assert: counter should reset to 1, not increment to 4
    expect(user.failedLoginAttempts).toBe(1);
  });

  it('should maintain attempt counter for recent failures', async () => {
    // Arrange: user with recent failed attempts
    const user = new User({
      name: 'Test User',
      email: 'recent@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      failedLoginAttempts: 2,
      lastFailedLogin: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    });
    await user.save();

    // Act: new failed attempt
    await user.incrementFailedAttempts();

    // Assert: counter should increment to 3
    expect(user.failedLoginAttempts).toBe(3);
  });

  it('should allow successful login to reset all attempt tracking', async () => {
    // Arrange: user with failed attempts and lock
    const user = new User({
      name: 'Test User',
      email: 'reset@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      failedLoginAttempts: 5,
      lastFailedLogin: new Date(),
      accountLockedUntil: new Date(Date.now() - 1000) // Expired lock
    });
    await user.save();

    // Act: reset failed attempts (simulates successful login)
    await user.resetFailedAttempts();

    // Assert: all tracking fields should be cleared
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lastFailedLogin).toBeNull();
    expect(user.accountLockedUntil).toBeNull();
    expect(user.isAccountLocked()).toBe(false);
  });

  it('should distinguish between suspended and locked accounts', async () => {
    // Arrange: suspended user with failed attempts
    const suspendedUser = new User({
      name: 'Suspended User',
      email: 'suspended@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'suspended', // Different from lock
      failedLoginAttempts: 5,
      accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000)
    });
    await suspendedUser.save();

    // Assert: account status takes precedence over lock status
    expect(suspendedUser.accountStatus).toBe('suspended');
    expect(suspendedUser.isAccountLocked()).toBe(true);
    
    // Both conditions should be checked independently
    // (suspension is permanent admin action, lock is temporary security measure)
  });

  it('should handle edge case of multiple rapid attempts', async () => {
    // Arrange: active user
    const user = new User({
      name: 'Rapid User',
      email: 'rapid@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await user.save();

    // Act: simulate sequential failed attempts (to avoid parallel save issues)
    for (let i = 0; i < 10; i++) {
      await user.incrementFailedAttempts();
    }

    // Assert: should be locked and counter should be at least 5
    expect(user.failedLoginAttempts).toBeGreaterThanOrEqual(5);
    expect(user.isAccountLocked()).toBe(true);
  });
});