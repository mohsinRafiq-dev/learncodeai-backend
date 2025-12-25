// Functional tests for Course Management - End-to-End Workflows
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Course from '../../src/models/Course.js';
import CourseSection from '../../src/models/CourseSection.js';
import CourseLesson from '../../src/models/CourseLesson.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';

describe('Course Functional Tests', () => {
  let testUser;
  let testCourse;
  let testSection;
  let testLesson;
  let authToken;

  beforeEach(async () => {
    // Clean up test data
    await CourseEnrollment.deleteMany({ user: testUser?._id });
    await CourseLesson.deleteMany({ title: /Test Lesson/ });
    await CourseSection.deleteMany({ title: /Test Section/ });
    await Course.deleteMany({ title: /Test Course/ });
    await User.deleteMany({ email: /testcourse.*@example\.com/ });

    // Create test user
    testUser = new User({
      name: 'Course Test User',
      email: 'testcourse@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await testUser.save();

    // Create test course
    testCourse = new Course({
      title: 'Test Course for Functional Testing',
      description: 'A test course for functional tests',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      difficulty: 'beginner',
      instructor: testUser._id,
      isPublished: true,
      isArchived: false
    });
    await testCourse.save();

    // Create test section
    testSection = new CourseSection({
      title: 'Test Section 1',
      description: 'First test section',
      course: testCourse._id,
      order: 1
    });
    await testSection.save();

    // Create test lesson
    testLesson = new CourseLesson({
      title: 'Test Lesson 1',
      content: 'This is test lesson content',
      section: testSection._id,
      order: 1,
      estimatedTime: 30
    });
    await testLesson.save();

    // Add section to course
    testCourse.sections.push(testSection._id);
    await testCourse.save();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: testUser.email,
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up test data
    await CourseEnrollment.deleteMany({ user: testUser?._id });
    await CourseLesson.deleteMany({ title: /Test Lesson/ });
    await CourseSection.deleteMany({ title: /Test Section/ });
    await Course.deleteMany({ title: /Test Course/ });
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  it('should enroll user in course from UI', async () => {
    // Step 1: Browse courses (public route)
    const coursesResponse = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(coursesResponse.body.success).toBe(true);
    expect(Array.isArray(coursesResponse.body.data)).toBe(true);

    // Step 2: View specific course details
    const courseDetailResponse = await request(app)
      .get(`/api/courses/${testCourse._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(courseDetailResponse.body.success).toBe(true);
    expect(courseDetailResponse.body.data._id).toBe(testCourse._id.toString());

    // Step 3: Enroll in the course
    const enrollResponse = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ courseId: testCourse._id })
      .expect(201);

    expect(enrollResponse.body.success).toBe(true);
    expect(enrollResponse.body.message).toContain('Successfully enrolled');

    // Step 4: Verify enrollment in user's enrolled courses
    const enrolledResponse = await request(app)
      .get('/api/courses/user/enrolled')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(enrolledResponse.body.success).toBe(true);
    expect(Array.isArray(enrolledResponse.body.data)).toBe(true);
    expect(enrolledResponse.body.data.length).toBeGreaterThan(0);

    const enrolledCourse = enrolledResponse.body.data.find(
      enrollment => enrollment.course._id.toString() === testCourse._id.toString()
    );
    expect(enrolledCourse).toBeDefined();

    // Step 5: Check enrollment details
    const enrollmentDetailResponse = await request(app)
      .get(`/api/courses/${testCourse._id}/enrollment`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(enrollmentDetailResponse.body.success).toBe(true);
    expect(enrollmentDetailResponse.body.data.user.toString()).toBe(testUser._id.toString());
    expect(enrollmentDetailResponse.body.data.course._id.toString()).toBe(testCourse._id.toString());
  });

  it('should update progress after lesson completion', async () => {
    // First enroll in the course
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ courseId: testCourse._id })
      .expect(201);

    // Step 1: Complete a lesson
    const completeResponse = await request(app)
      .put(`/api/courses/${testCourse._id}/progress/lesson`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sectionId: testSection._id,
        lessonId: testLesson._id
      })
      .expect(200);

    expect(completeResponse.body.success).toBe(true);
    expect(completeResponse.body.message).toContain('Lesson marked as completed');

    // Step 2: Check enrollment details to verify progress
    const enrollmentResponse = await request(app)
      .get(`/api/courses/${testCourse._id}/enrollment`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(enrollmentResponse.body.success).toBe(true);
    const enrollment = enrollmentResponse.body.data;

    // Verify section progress exists
    const sectionProgress = enrollment.sectionProgress.find(
      sp => sp.section.toString() === testSection._id.toString()
    );
    expect(sectionProgress).toBeDefined();

    // Verify lesson is marked as completed
    const lessonProgress = sectionProgress.lessons.find(
      lp => lp.lesson.toString() === testLesson._id.toString()
    );
    expect(lessonProgress).toBeDefined();
    expect(lessonProgress.isCompleted).toBe(true);
    expect(lessonProgress.completedAt).toBeDefined();

    // Step 3: Verify progress calculation
    expect(enrollmentResponse.body.progress).toBeDefined();
    expect(enrollmentResponse.body.progress.completedLessons).toBeGreaterThan(0);
    expect(enrollmentResponse.body.progress.totalLessons).toBeGreaterThan(0);
  });

  it('should prevent duplicate enrollment', async () => {
    // First enrollment should succeed
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ courseId: testCourse._id })
      .expect(201);

    // Second enrollment should fail
    const duplicateResponse = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ courseId: testCourse._id })
      .expect(400);

    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.message).toContain('already enrolled');
  });

  it('should handle course browsing and filtering', async () => {
    // Create another course with different language
    const jsCourse = new Course({
      title: 'JavaScript Test Course',
      description: 'JS test course',
      shortDescription: 'JS course',
      language: 'javascript',
      category: 'web-development',
      difficulty: 'intermediate',
      instructor: testUser._id,
      isPublished: true
    });
    await jsCourse.save();

    // Browse all courses
    const allCoursesResponse = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(allCoursesResponse.body.success).toBe(true);
    expect(allCoursesResponse.body.data.length).toBeGreaterThanOrEqual(2);

    // Filter by language
    const pythonCoursesResponse = await request(app)
      .get('/api/courses/language/python')
      .expect(200);

    expect(pythonCoursesResponse.body.success).toBe(true);
    expect(pythonCoursesResponse.body.data.length).toBeGreaterThanOrEqual(1);

    // Verify all returned courses are Python
    pythonCoursesResponse.body.data.forEach(course => {
      expect(course.language).toBe('python');
    });

    // Clean up
    await Course.findByIdAndDelete(jsCourse._id);
  });

  it('should track enrollment count accurately', async () => {
    // Create another user
    const user2 = new User({
      name: 'Second Test User',
      email: 'testcourse2@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await user2.save();

    // Login as second user
    const loginResponse2 = await request(app)
      .post('/api/auth/signin')
      .send({
        email: user2.email,
        password: 'password123'
      });

    const token2 = loginResponse2.body.token;

    // Check initial enrollment count
    const initialCourse = await Course.findById(testCourse._id);
    const initialCount = initialCourse.enrollmentCount || 0;

    // First user enrolls
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ courseId: testCourse._id })
      .expect(201);

    // Check count after first enrollment
    let updatedCourse = await Course.findById(testCourse._id);
    expect(updatedCourse.enrollmentCount).toBe(initialCount + 1);

    // Second user enrolls
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${token2}`)
      .send({ courseId: testCourse._id })
      .expect(201);

    // Check count after second enrollment
    updatedCourse = await Course.findById(testCourse._id);
    expect(updatedCourse.enrollmentCount).toBe(initialCount + 2);

    // Clean up
    await User.findByIdAndDelete(user2._id);
  });
});
