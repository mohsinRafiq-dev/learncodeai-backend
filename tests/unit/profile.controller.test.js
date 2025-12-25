// Unit tests for Profile Controller
import { jest } from '@jest/globals';
import {
  getProfile,
  updateProfile,
  markPromptShown,
  uploadProfilePicture,
  getCourseProgress,
  getTutorialProgress,
  getDashboardStats,
  getUserEnrollments,
  updateEnrollmentStatus
} from '../../src/controllers/profileController.js';
import User from '../../src/models/User.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';
import Progress from '../../src/models/Progress.js';
import Certificate from '../../src/models/Certificate.js';

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}, user = null, file = null) => ({
  body,
  params,
  query,
  user,
  file
});

const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  return res;
};

describe('Profile Controller', () => {
  let userId;

  beforeEach(async () => {
    // Clean up collections
    await User.deleteMany({});
    await CourseEnrollment.deleteMany({});
    await Progress.deleteMany({});
    await Certificate.deleteMany({});

    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    userId = user._id.toString();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.name).toBe('Test User');
      expect(res.responseData.data.email).toBe('test@example.com');
      expect(res.responseData.data.password).toBeUndefined(); // Should be excluded
    });

    it('should return 404 for non-existent user', async () => {
      const req = mockRequest({}, {}, {}, { _id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await getProfile(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = mockRequest({
        name: 'Updated Name',
        bio: 'Updated bio',
        skills: ['JavaScript', 'Node.js']
      }, {}, {}, { _id: userId });
      const res = mockResponse();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.name).toBe('Updated Name');
      expect(res.responseData.data.bio).toBe('Updated bio');
      expect(res.responseData.data.skills).toEqual(['JavaScript', 'Node.js']);
    });

    it('should mark profile as complete when all required fields are filled', async () => {
      const req = mockRequest({
        name: 'Complete User',
        profilePicture: 'pic.jpg',
        dateOfBirth: '1990-01-01',
        bio: 'Complete bio',
        programmingLanguages: ['JavaScript'],
        skills: ['Node.js']
      }, {}, {}, { _id: userId });
      const res = mockResponse();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.data.isProfileComplete).toBe(true);
    });

    it('should handle empty string values correctly', async () => {
      const req = mockRequest({
        name: '', // Should not update
        bio: 'Valid bio'
      }, {}, {}, { _id: userId });
      const res = mockResponse();

      await updateProfile(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.data.name).toBe('Test User'); // Should remain unchanged
      expect(res.responseData.data.bio).toBe('Valid bio');
    });
  });

  describe('markPromptShown', () => {
    it('should mark profile completion prompt as shown', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await markPromptShown(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.profileCompletionPromptShown).toBe(true);
    });
  });

  describe('uploadProfilePicture', () => {
    it('should return 400 when no file is uploaded', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await uploadProfilePicture(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('No file uploaded');
    });

    // Note: File upload testing would require more complex setup with actual file mocking
    // For now, we test the validation logic
  });

  describe('getCourseProgress', () => {
    beforeEach(async () => {
      // Create test progress data
      await Progress.create({
        user: userId,
        tutorial: '507f1f77bcf86cd799439011',
        completionPercent: 50,
        timeSpentMinutes: 30
      });
    });

    it('should get course progress for user', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getCourseProgress(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(Array.isArray(res.responseData.data)).toBe(true);
    });
  });

  describe('getTutorialProgress', () => {
    it('should get tutorial progress for user', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getTutorialProgress(req, res);

      // Should return 200 even if no tutorials exist
      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(Array.isArray(res.responseData.data)).toBe(true);
    });
  });

  describe('getDashboardStats', () => {
    it('should get dashboard statistics', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getDashboardStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveProperty('enrolledCourses');
      expect(res.responseData.data).toHaveProperty('completedCourses');
      expect(res.responseData.data).toHaveProperty('certificates');
    });
  });

  describe('getUserEnrollments', () => {
    it('should get user enrollments', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getUserEnrollments(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(Array.isArray(res.responseData.data)).toBe(true);
    });
  });

  describe('updateEnrollmentStatus', () => {
    it('should reject invalid status', async () => {
      const req = mockRequest({
        status: 'invalid-status'
      }, { enrollmentId: '507f1f77bcf86cd799439011' }, {}, { _id: userId });
      const res = mockResponse();

      await updateEnrollmentStatus(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe("Invalid status. Must be 'active', 'paused', or 'withdrawn'");
    });
  });
});