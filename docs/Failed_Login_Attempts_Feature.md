# Failed Login Attempts & Account Lockout Feature

## Overview

This feature implements a security mechanism that temporarily locks user accounts after 5 consecutive failed login attempts to prevent brute force attacks.

## How It Works

### Account Lockout Rules

1. **Failed Attempt Tracking**: Each failed login attempt is counted and timestamped
2. **Lockout Threshold**: After 5 failed attempts, the account is locked for 30 minutes
3. **Attempt Reset**: Failed attempts are reset after successful login or after 2 hours of inactivity
4. **Lockout Expiration**: Account automatically unlocks after 30 minutes
5. **Correct Password Override**: If a user provides the correct password after the lock period expires, they can login immediately and all failed attempts are reset

### Database Fields Added

The following fields were added to the User model:

```javascript
failedLoginAttempts: {
  type: Number,
  default: 0
}

lastFailedLogin: {
  type: Date,
  default: null
}

accountLockedUntil: {
  type: Date,
  default: null
}
```

### New User Methods

- `isAccountLocked()` - Checks if account is currently locked
- `incrementFailedAttempts()` - Increments failed attempts and locks if threshold reached
- `resetFailedAttempts()` - Clears all failed attempt tracking

## API Response Changes

### Failed Login Responses

**Before lockout (attempts 1-4):**
```json
{
  "status": "fail",
  "message": "Incorrect email or password. 3 attempts remaining before account lockout.",
  "attemptsRemaining": 3
}
```

**Account locked (attempt 5 or during lockout period):**
```json
{
  "status": "fail",
  "message": "Account temporarily locked due to multiple failed login attempts. Please try again in 25 minutes.",
  "accountLocked": true,
  "lockTimeRemaining": 25
}
```

### HTTP Status Codes

- **401**: Invalid credentials (before lockout)
- **423**: Account locked (Locked resource status)

## Security Features

1. **Brute Force Protection**: Prevents automated password guessing
2. **Rate Limiting**: 5 attempts before lockout
3. **Time-based Reset**: Old attempts expire after 2 hours
4. **Automatic Unlock**: Accounts unlock after 30 minutes
5. **Protected Routes**: Middleware checks for locked accounts

## Implementation Files

- `src/models/User.js` - Database schema and methods
- `src/controllers/authController.js` - Login logic and lockout handling
- `src/middleware/authMiddleware.js` - Protected route validation
- `tests/unit/failed-login-attempts.test.js` - Unit tests
- `tests/integration/failed-login-attempts.routes.test.js` - Integration tests
- `tests/business/failed-login-attempts.business.test.js` - Business logic tests

## Usage Examples

### Successful Flow
1. User enters wrong password 3 times
2. System warns: "2 attempts remaining"
3. User enters correct password
4. System resets failed attempts and logs user in

### Lockout Flow
1. User enters wrong password 5 times
2. System locks account for 30 minutes
3. User must wait 30 minutes before attempting login again
4. After 30 minutes, user can try logging in again

### Correct Password After Lock
1. User gets locked after 5 failed attempts
2. User waits for lock to expire (or tries immediately after 30 minutes)
3. User enters correct password
4. System allows login and resets all failed attempt tracking

## Future Enhancements

Potential improvements could include:
- Configurable lockout duration
- Configurable attempt threshold
- Email notifications on account lockout
- Admin interface to manually unlock accounts
- IP-based tracking for additional security