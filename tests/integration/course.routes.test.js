// Integration tests for Course Routes
import request from 'supertest';
import app from '../../src/app.js';
import Course from '../../src/models/Course.js';
import User from '../../src/models/User.js';
import jwt from 'jsonwebtoken';

describe('Course Routes', () => {
  let testUser, testCourse, authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await testUser.save();

    // Create test course
    testCourse = new Course({
      title: 'Test Course',
      description: 'Test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: testUser._id,
      isPublished: true
    });
    await testCourse.save();

    // Get auth token by creating JWT manually
    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing-only', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  });

  it('should get all courses', async () => {
    const response = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should get course by id', async () => {
    const response = await request(app)
      .get(`/api/courses/${testCourse._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Course');
  });

  it('should enroll user in course', async () => {
    const response = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        courseId: testCourse._id
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('enrolled');
  });

  it('should get user enrolled courses', async () => {
    // First enroll
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        courseId: testCourse._id
      });

    // Then get enrolled courses
    const response = await request(app)
      .get('/api/courses/user/enrolled')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
