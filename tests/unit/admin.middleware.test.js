// Unit tests for Admin Middleware
import adminMiddleware from '../../src/middleware/adminMiddleware.js';

describe('Admin Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: function() { return this; },
      json: function() { return this; }
    };
    mockRes.status = mockRes.status.bind(mockRes);
    mockRes.json = mockRes.json.bind(mockRes);
    mockNext = function() {};
  });

  it('should call next() for admin user', () => {
    // Arrange: authenticated admin user
    mockReq.user = {
      id: '123',
      role: 'admin',
      email: 'admin@example.com'
    };

    let nextCalled = false;
    mockNext = () => { nextCalled = true; };
    let statusCalled = false;
    mockRes.status = () => { statusCalled = true; return mockRes; };

    // Act: call middleware
    adminMiddleware(mockReq, mockRes, mockNext);

    // Assert: next() called, no response sent
    expect(nextCalled).toBe(true);
    expect(statusCalled).toBe(false);
  });

  it('should return 401 for unauthenticated user', () => {
    // Arrange: no user in request
    mockReq.user = null;

    let statusCode;
    mockRes.status = (code) => { statusCode = code; return mockRes; };
    let jsonData;
    mockRes.json = (data) => { jsonData = data; return mockRes; };

    // Act: call middleware
    adminMiddleware(mockReq, mockRes, mockNext);

    // Assert: 401 response
    expect(statusCode).toBe(401);
    expect(jsonData.message).toBe("Unauthorized - Please login first");
  });

  it('should return 403 for non-admin user', () => {
    // Arrange: authenticated non-admin user
    mockReq.user = {
      id: '123',
      role: 'user',
      email: 'user@example.com'
    };

    let statusCode;
    mockRes.status = (code) => { statusCode = code; return mockRes; };
    let jsonData;
    mockRes.json = (data) => { jsonData = data; return mockRes; };

    // Act: call middleware
    adminMiddleware(mockReq, mockRes, mockNext);

    // Assert: 403 response
    expect(statusCode).toBe(403);
    expect(jsonData.message).toBe("Forbidden - Admin access required");
  });
});
