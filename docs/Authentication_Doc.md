# Authentication Documentation

## Overview

The CodeHub application implements a comprehensive authentication system with multiple sign-in methods, email verification, and password reset functionality. This document provides detailed information about all authentication features implemented in the system.

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [User Registration](#user-registration)
3. [Email Verification](#email-verification)
4. [Sign In Process](#sign-in-process)
5. [OAuth Integration](#oauth-integration)
6. [Password Reset](#password-reset)
7. [JWT Token Management](#jwt-token-management)
8. [API Endpoints](#api-endpoints)
9. [Security Features](#security-features)
10. [Error Handling](#error-handling)
11. [Configuration](#configuration)

---

## Authentication Methods

The application supports the following authentication methods:

### 1. Email/Password Authentication
- Traditional email and password-based registration and login
- Requires email verification before account activation
- Password hashing using bcrypt

### 2. Google OAuth 2.0
- Sign in with Google account
- Automatic profile information extraction (name, email, profile picture)
- No email verification required for OAuth users

### 3. GitHub OAuth
- Sign in with GitHub account
- Access to user's public profile and email
- Automatic account creation for new users

---

## User Registration

### Registration Flow

1. **Initial Signup**: User provides name, email, password, and password confirmation
2. **Validation**: Server validates input and checks for existing users
3. **Account Creation**: User account created with `pending` status
4. **OTP Generation**: 6-digit OTP generated and stored
5. **Email Sent**: Verification email sent to user's email address
6. **Email Verification**: User enters OTP to activate account

### Registration Endpoint

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

### Response Types

**Success (Pending Verification):**
```json
{
  "status": "success",
  "message": "Account created successfully! Please check your email for verification code.",
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "needsVerification": true
  }
}
```

**User Already Exists (Unverified):**
```json
{
  "status": "success",
  "message": "Account already exists but not verified. New verification code sent to your email.",
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "needsVerification": true,
    "isResend": true
  }
}
```

---

## Email Verification

### OTP System

- **OTP Length**: 6 digits
- **Expiration**: 10 minutes
- **Resend**: Users can request new OTP if expired
- **Auto-cleanup**: Expired OTPs are automatically cleared

### Verification Process

1. User receives OTP via email
2. User enters OTP on verification page
3. System validates OTP and expiration
4. Account status changed from `pending` to `active`
5. JWT token issued for immediate login

### Verification Endpoints

**Verify Email:**
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Resend OTP:**
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

---

## Sign In Process

### Email/Password Sign In

1. User provides email and password
2. System validates credentials
3. Checks email verification status
4. If unverified, automatically sends new OTP
5. If verified, issues JWT token and logs user in

### Sign In Endpoint

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Response Types

**Successful Login:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "accountStatus": "active"
    }
  }
}
```

**Email Not Verified:**
```json
{
  "status": "fail",
  "message": "Your email is not verified. We sent a new verification code to your email.",
  "needsEmailVerification": true,
  "email": "john@example.com",
  "autoResent": true
}
```

---

## OAuth Integration

### Google OAuth

**Configuration Required:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google authorization
3. Google returns with authorization code
4. Server exchanges code for user profile
5. Account created/updated and user logged in

**Google OAuth Endpoints:**
```http
GET /api/auth/google
GET /api/auth/google/callback
```

### GitHub OAuth

**Configuration Required:**
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

**Flow:**
1. User clicks "Sign in with GitHub"
2. Redirected to GitHub authorization
3. GitHub returns with authorization code
4. Server exchanges code for user profile
5. Account created/updated and user logged in

**GitHub OAuth Endpoints:**
```http
GET /api/auth/github
GET /api/auth/github/callback
```

### OAuth User Handling

- **Existing User**: Links OAuth account to existing email
- **New User**: Creates new account with OAuth profile data
- **Email Verification**: OAuth users are automatically verified
- **Profile Data**: Name, email, and profile picture extracted

---

## Password Reset

### Three-Step Password Reset Process

1. **Request Reset**: User provides email, receives OTP
2. **Verify OTP**: User enters OTP, receives temporary reset token
3. **Reset Password**: User provides new password with reset token

### Password Reset Endpoints

**Step 1 - Request Reset:**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Step 2 - Verify OTP:**
```http
POST /api/auth/verify-reset-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Step 3 - Reset Password:**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "temporary_reset_token",
  "newPassword": "NewSecurePassword123",
  "confirmPassword": "NewSecurePassword123"
}
```

### Security Features

- **OTP Expiration**: Password reset OTPs expire in 10 minutes
- **Reset Token**: Temporary tokens valid for 10 minutes only
- **One-Time Use**: Reset tokens become invalid after use
- **Email Privacy**: System doesn't reveal if email exists during reset request

---

## JWT Token Management

### Token Configuration

- **Algorithm**: HS256
- **Default Expiration**: 90 days
- **Secret**: Configurable via `JWT_SECRET` environment variable

### Token Delivery

1. **HTTP Cookie**: Secure, HttpOnly cookie named `jwt`
2. **Response Body**: Token included in login response for client-side storage
3. **Authorization Header**: Accepted as `Bearer <token>` for API requests

### Token Validation

- Middleware `protect` validates all protected routes
- Checks token from Authorization header or cookies
- Verifies token signature and expiration
- Ensures user still exists in database

### Logout Process

- Clears JWT cookie by setting expired cookie
- Client should remove token from local storage

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/signin` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/verify-email` | Email verification |
| POST | `/api/auth/resend-verification` | Resend verification OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/verify-reset-otp` | Verify password reset OTP |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/google` | Google OAuth initiation |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/github` | GitHub OAuth initiation |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user info |

### Development Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/dev/account-status/:email` | Check account status |
| DELETE | `/api/auth/dev/delete-unverified/:email` | Delete unverified account |

---

## Security Features

### Password Security

- **Bcrypt Hashing**: All passwords hashed with bcrypt (12 rounds)
- **Password Validation**: Enforced on both client and server
- **Password Confirmation**: Required during registration and reset

### Account Security

- **Email Verification**: Required before account activation
- **Account Status**: Tracks account state (pending, active, suspended)
- **Last Login Tracking**: Records user's last login timestamp

### Session Security

- **Secure Cookies**: HTTPS-only cookies in production
- **HttpOnly Cookies**: Prevents XSS attacks on tokens
- **Token Expiration**: Configurable token lifetime
- **CORS Protection**: Proper CORS configuration for cross-origin requests

### OAuth Security

- **State Validation**: Prevents CSRF attacks during OAuth flow
- **Scope Limitation**: Minimal required scopes for OAuth providers
- **Profile Validation**: Validates OAuth provider responses

---

## Error Handling

### Common Error Responses

**Validation Error:**
```json
{
  "status": "fail",
  "message": "Please provide name, email, password, and confirm password"
}
```

**Authentication Error:**
```json
{
  "status": "fail",
  "message": "Incorrect email or password"
}
```

**Authorization Error:**
```json
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access."
}
```

**Server Error:**
```json
{
  "status": "error",
  "message": "Something went wrong during signup"
}
```

### Error Categories

- **400 Bad Request**: Invalid input data or validation errors
- **401 Unauthorized**: Authentication required or failed
- **500 Internal Server Error**: Server-side errors

---

## Configuration

### Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Optional Configuration

- **Email Service**: System works without email (auto-verification in development)
- **OAuth Providers**: Can be enabled/disabled based on credentials availability
- **Token Expiration**: Configurable JWT and cookie expiration times

---

## Database Schema

### User Model Fields

```javascript
{
  name: String,              // User's full name
  email: String,             // User's email (unique)
  password: String,          // Hashed password (optional for OAuth users)
  
  // OAuth Integration
  googleId: String,          // Google OAuth ID
  githubId: String,          // GitHub OAuth ID
  profilePicture: String,    // Profile picture URL
  
  // Account Status
  accountStatus: String,     // 'pending', 'active', 'suspended'
  isEmailVerified: Boolean,  // Email verification status
  lastLogin: Date,           // Last login timestamp
  
  // Email Verification
  emailVerificationOTP: String,     // Current verification OTP
  emailVerificationOTPExpires: Date, // OTP expiration time
  
  // Password Reset
  passwordResetOTP: String,         // Current reset OTP
  passwordResetOTPExpires: Date,    // Reset OTP expiration time
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing

### Test Coverage

The authentication system includes comprehensive test coverage:

- **Unit Tests**: Individual controller and service methods
- **Integration Tests**: Full authentication flows
- **End-to-End Tests**: Complete user registration and login scenarios

### Test Files

- `tests/unit/auth.controller.test.js` - Controller unit tests
- `tests/unit/user.model.test.js` - User model tests
- `tests/unit/email.service.test.js` - Email service tests
- `tests/integration/auth.routes.test.js` - Route integration tests
- `tests/integration/e2e.test.js` - End-to-end authentication flows

### Running Tests

```bash
# Run all authentication tests
npm test

# Run specific test files
npm test auth.controller.test.js
npm test auth.routes.test.js

# Run tests with coverage
npm run test:coverage
```

---

## Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check email service configuration
   - Verify EMAIL_* environment variables
   - Check spam folder for verification emails

2. **OAuth Not Working**
   - Verify OAuth client credentials
   - Check callback URLs configuration
   - Ensure OAuth apps are properly configured on provider side

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Ensure consistent secret across server restarts

4. **Account Verification Issues**
   - Check OTP expiration times
   - Verify email delivery
   - Use development endpoints to check account status

### Debug Mode

Enable detailed logging by setting appropriate log levels in the application configuration.

---

## Changelog

### Version History

- **v1.0.0** - Initial authentication system with email/password
- **v1.1.0** - Added Google OAuth integration
- **v1.2.0** - Added GitHub OAuth integration
- **v1.3.0** - Implemented OTP-based email verification
- **v1.4.0** - Added password reset functionality
- **v1.5.0** - Enhanced error handling and security features

---

## Future Enhancements

### Planned Features

1. **Multi-Factor Authentication (MFA)**
   - SMS-based OTP
   - TOTP (Time-based OTP) support
   - Backup codes

2. **Additional OAuth Providers**
   - Facebook OAuth
   - Twitter OAuth
   - LinkedIn OAuth

3. **Enhanced Security**
   - Rate limiting for authentication attempts
   - Account lockout after failed attempts
   - Advanced password policies

4. **User Management**
   - Admin panel for user management
   - Bulk user operations
   - User activity monitoring

---

## Support

For technical support or questions about the authentication system, please:

1. Check this documentation first
2. Review the test files for usage examples
3. Check the troubleshooting section
4. Create an issue in the project repository

---

*Last updated: October 2, 2025*