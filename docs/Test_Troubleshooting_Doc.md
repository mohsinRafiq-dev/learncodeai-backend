# CodeHub Backend Test Troubleshooting Guide

## 🔧 Common Test Issues and Solutions

This guide helps developers quickly resolve common testing issues encountered in the CodeHub backend test suite.

## 🚨 Quick Diagnostics

### Test Execution Status Check
```bash
# Check if all tests are passing
npm test

# Expected output for healthy test suite:
# Test Suites: 9 passed, 9 total
# Tests: 168 passed, 168 total
```

## 🛠️ Environment Issues

### Issue: MongoDB Connection Errors
**Symptoms:**
```
MongoMemoryServer: Error: spawn mongod ENOENT
Connection to MongoDB failed
```

**Solutions:**
```bash
# 1. Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 2. Ensure MongoDB Memory Server is properly configured
npm install mongodb-memory-server@9.1.4 --save-dev

# 3. Check Node.js version compatibility
node --version  # Should be >= 16.0.0
```

### Issue: ES Modules Import Errors
**Symptoms:**
```
SyntaxError: Cannot use import statement outside a module
```

**Solutions:**
```bash
# Ensure NODE_OPTIONS includes experimental VM modules
export NODE_OPTIONS="--experimental-vm-modules"

# Or run tests with explicit flag
NODE_OPTIONS="--experimental-vm-modules" npm test
```

## 🔒 Authentication Test Issues

### Issue: JWT Token Tests Failing
**Symptoms:**
```
JsonWebTokenError: jwt malformed
TokenExpiredError: jwt expired
```

**Solutions:**
```javascript
// Ensure JWT_SECRET is set in .env.test
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRES_IN=7d

// Check token generation in tests
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
expect(token).toBeDefined();
```

### Issue: OTP Verification Failing
**Symptoms:**
```
OTP verification failed: provided OTP does not match stored OTP
```

**Solutions:**
```javascript
// Ensure consistent OTP in tests
const testOTP = '123456';
user.verificationOTP = testOTP;
await user.save();

// Use the same OTP in verification request
const response = await request(app)
  .post('/api/auth/verify-email')
  .send({ email: user.email, otp: testOTP });
```

## 🐳 Docker-Related Issues

### Issue: Docker Service Unavailable
**Symptoms:**
```
Error: Docker service unavailable
spawn docker ENOENT
```

**Solutions:**
```javascript
// Tests should handle Docker unavailability gracefully
test('should handle Docker unavailable', async () => {
  const result = await codeExecutorService.executeCode('print("test")', 'python');
  
  // Expect error result, not thrown exception
  expect(result.error).toBe(true);
  expect(result.output).toContain('Docker service unavailable');
});
```

### Issue: Code Execution Timeouts
**Symptoms:**
```
Error: Execution timed out after 10 seconds
```

**Solutions:**
```javascript
// Increase timeout for integration tests
jest.setTimeout(30000); // 30 seconds

// Mock long-running operations in unit tests
jest.spyOn(codeExecutorService, 'executeCode').mockResolvedValue({
  output: 'Mocked result',
  executionTime: '100ms',
  error: false
});
```

## 📧 Email Service Issues

### Issue: SMTP Connection Failures
**Symptoms:**
```
Error: getaddrinfo ENOTFOUND smtp.gmail.com
```

**Solutions:**
```javascript
// Mock email service in tests
beforeEach(() => {
  jest.spyOn(emailService, 'sendEmail').mockResolvedValue({
    success: true,
    messageId: 'mock-message-id'
  });
});

// Ensure test environment variables
EMAIL_HOST=smtp.test.com
EMAIL_PORT=587
EMAIL_USER=test@example.com
EMAIL_PASS=test_password
```

## 🗃️ Database Issues

### Issue: Test Data Persistence
**Symptoms:**
```
Test data from previous test affecting current test
Duplicate key error
```

**Solutions:**
```javascript
// Ensure proper test isolation
afterEach(async () => {
  await User.deleteMany({});
  await mongoose.connection.dropDatabase();
});

// Use unique test data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`
};
```

### Issue: MongoDB Memory Server Startup
**Symptoms:**
```
MongoMemoryServer failed to start
```

**Solutions:**
```javascript
// Increase startup timeout
const mongoServer = await MongoMemoryServer.create({
  binary: {
    downloadDir: './mongodb-binaries'
  },
  instance: {
    dbName: 'test',
    port: undefined // Use random port
  }
});

// Add proper error handling
beforeAll(async () => {
  try {
    await mongoServer.start();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    throw error;
  }
});
```

## ⚡ Performance Issues

### Issue: Slow Test Execution
**Symptoms:**
```
Tests taking > 30 seconds to complete
```

**Solutions:**
```bash
# Run tests in parallel (default)
npm test

# Reduce test timeout for faster feedback
jest.setTimeout(10000); // 10 seconds

# Run specific test suite only
npm test -- "auth.controller.test.js"
```

### Issue: Memory Leaks in Tests
**Symptoms:**
```
JavaScript heap out of memory
```

**Solutions:**
```javascript
// Proper cleanup in afterEach/afterAll
afterEach(async () => {
  jest.clearAllMocks();
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

## 🔍 Debugging Strategies

### Debug Individual Tests
```bash
# Run single test with debug output
npm test -- --verbose "specific.test.js"

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Enable Detailed Logging
```javascript
// Add debug logging to tests
console.log('Test data:', testUser);
console.log('Response:', response.body);

// Use Jest debug mode
DEBUG=true npm test
```

### Test Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

## 🚀 Best Practices for Test Maintenance

### 1. Test Isolation
```javascript
// Always clean up after tests
afterEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});
```

### 2. Consistent Test Data
```javascript
// Use factories for test data
const createTestUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!@#',
  ...overrides
});
```

### 3. Mock External Dependencies
```javascript
// Mock external services
jest.mock('../src/services/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}));
```

## 📋 Health Check Checklist

Before reporting test issues, verify:

- [ ] Node.js version >= 16.0.0
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set (`.env.test`)
- [ ] MongoDB Memory Server can start
- [ ] No conflicting processes on test ports
- [ ] Sufficient disk space for temp files
- [ ] Network connectivity for external mocks

## 🆘 Getting Help

If issues persist after trying these solutions:

1. **Check the logs**: Look for specific error messages
2. **Run individual tests**: Isolate the failing test
3. **Clear caches**: `npm cache clean --force`
4. **Restart services**: Restart Docker/MongoDB if needed
5. **Check environment**: Verify all required environment variables

## 📞 Emergency Test Recovery

If all tests are failing:

```bash
# Nuclear option: Complete reset
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Reset test database
rm -rf .mongodb-memory-server

# Run tests with verbose output
NODE_OPTIONS="--experimental-vm-modules" npm test -- --verbose
```

## 📊 Test Health Monitoring

### Expected Test Output
```
 PASS  tests/unit/user.model.test.js
 PASS  tests/unit/auth.controller.test.js
 PASS  tests/unit/auth.middleware.test.js
 PASS  tests/unit/email.service.test.js
 PASS  tests/unit/codeExecutor.service.test.js
 PASS  tests/integration/auth.routes.test.js
 PASS  tests/integration/codeExecution.routes.test.js
 PASS  tests/integration/e2e.test.js

Test Suites: 9 passed, 9 total
Tests:       168 passed, 168 total
```

### Warning Signs
- Any test suite showing failures
- Timeouts or hanging tests
- Memory warnings
- Inconsistent test results

---

**Last Updated**: October 2, 2025  
**Troubleshooting Version**: 1.0.0  
**Target Success Rate**: 168/168 (100%)