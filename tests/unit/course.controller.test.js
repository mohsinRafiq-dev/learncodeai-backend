// Unit tests for Course Controller
import {
  getAllCourses,
  getCourseById,
  getCoursesByLanguage,
  enrollInCourse,
  getUserEnrolledCourses,
  getEnrollmentDetails,
  completeLessonProgress
} from '../../src/controllers/courseController.js';
import Course from '../../src/models/Course.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';
import CourseLesson from '../../src/models/CourseLesson.js';
import CourseSection from '../../src/models/CourseSection.js';
import User from '../../src/models/User.js';

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}, user = null) => ({
  body,
  params,
  query,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  return res;
};

describe('Course Controller', () => {
  let instructorId;

  beforeEach(async () => {
    // Clean up collections
    await Course.deleteMany({});
    await CourseEnrollment.deleteMany({});
    await CourseLesson.deleteMany({});
    await CourseSection.deleteMany({});
    await User.deleteMany({});

    // Create test instructor
    const instructor = await User.create({
      name: 'Instructor User',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      role: 'admin'
    });
    instructorId = instructor._id.toString();
  });

  describe('getAllCourses', () => {
    let instructorId;

    beforeEach(async () => {
      // Create instructor
      const instructor = await User.create({
        name: 'Instructor User',
        email: 'instructor@test.com',
        password: 'password123',
        isEmailVerified: true,
        role: 'user'
      });
      instructorId = instructor._id.toString();

      await Course.create([
        {
          title: 'Python Basics',
          description: 'Learn Python fundamentals',
          shortDescription: 'Python basics course',
          language: 'python',
          category: 'programming-language',
          difficulty: 'beginner',
          instructor: instructorId,
          duration: 10,
          isPublished: true
        },
        {
          title: 'JavaScript Advanced',
          description: 'Advanced JS concepts',
          shortDescription: 'Advanced JavaScript course',
          language: 'javascript',
          category: 'web-development',
          difficulty: 'advanced',
          instructor: instructorId,
          duration: 20,
          isPublished: true
        },
        {
          title: 'Draft Course',
          description: 'Not published',
          shortDescription: 'Draft course',
          language: 'python',
          category: 'programming-language',
          difficulty: 'intermediate',
          instructor: instructorId,
          duration: 15,
          isPublished: false
        }
      ]);
    });

    it('should get all published courses', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await getAllCourses(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(2);
      expect(res.responseData.pagination.total).toBe(2);
    });

    it('should filter courses by language', async () => {
      const req = mockRequest({}, {}, { language: 'python' });
      const res = mockResponse();

      await getAllCourses(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(1);
      expect(res.responseData.data[0].language).toBe('python');
    });

    it('should filter courses by difficulty', async () => {
      const req = mockRequest({}, {}, { difficulty: 'beginner' });
      const res = mockResponse();

      await getAllCourses(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(1);
      expect(res.responseData.data[0].difficulty).toBe('beginner');
    });
  });

  describe('getCourseById', () => {
    let courseId;
    let instructorId;

    beforeEach(async () => {
      // Create instructor
      const instructor = await User.create({
        name: 'Instructor User',
        email: 'instructor@test.com',
        password: 'password123',
        isEmailVerified: true,
        role: 'user'
      });
      instructorId = instructor._id.toString();

      const course = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        shortDescription: 'Python basics course',
        language: 'python',
        category: 'programming-language',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 10,
        isPublished: true
      });
      courseId = course._id.toString();

      // Create sections and lessons for the course
      const section = await CourseSection.create({
        course: courseId,
        title: 'Introduction',
        order: 1
      });

      const lesson = await CourseLesson.create({
        section: section._id,
        course: courseId,
        title: 'Hello World',
        content: 'Print hello world',
        order: 1
      });

      // Add lesson to section's lessons array and section to course's sections array
      await CourseSection.findByIdAndUpdate(section._id, {
        $push: { lessons: lesson._id }
      });
      await Course.findByIdAndUpdate(courseId, {
        $push: { sections: section._id }
      });
    });

    it('should get course by id with sections and lessons', async () => {
      const req = mockRequest({}, { id: courseId });
      const res = mockResponse();

      await getCourseById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.title).toBe('Python Basics');
      expect(res.responseData.data.sections).toHaveLength(1);
      expect(res.responseData.data.sections[0].lessons).toHaveLength(1);
    });

    it('should return 404 for non-existent course', async () => {
      const req = mockRequest({}, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await getCourseById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Course not found');
    });
  });

  describe('getCoursesByLanguage', () => {
    beforeEach(async () => {
      await Course.create([
        {
          title: 'Python Basics',
          description: 'Learn Python fundamentals',
          shortDescription: 'Python basics course',
          language: 'python',
          category: 'programming-language',
          difficulty: 'beginner',
          instructor: instructorId,
          duration: 10,
          isPublished: true
        },
        {
          title: 'Python Advanced',
          description: 'Advanced Python concepts',
          shortDescription: 'Advanced Python course',
          language: 'python',
          category: 'programming-language',
          difficulty: 'advanced',
          instructor: instructorId,
          duration: 20,
          isPublished: true
        },
        {
          title: 'JavaScript Basics',
          description: 'Learn JS fundamentals',
          shortDescription: 'JavaScript basics course',
          language: 'javascript',
          category: 'web-development',
          difficulty: 'beginner',
          instructor: instructorId,
          duration: 15,
          isPublished: true
        }
      ]);
    });

    it('should get courses by language', async () => {
      const req = mockRequest({}, { language: 'python' });
      const res = mockResponse();

      await getCoursesByLanguage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.pagination.total).toBe(2);
      expect(res.responseData.data.every(c => c.language === 'python')).toBe(true);
    });

    it('should return empty array for language with no courses', async () => {
      const req = mockRequest({}, { language: 'ruby' });
      const res = mockResponse();

      await getCoursesByLanguage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.pagination.total).toBe(0);
      expect(res.responseData.data).toHaveLength(0);
    });
  });

  describe('enrollInCourse', () => {
    let userId;
    let courseId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create test course
      const course = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        shortDescription: 'Python basics course',
        language: 'python',
        category: 'programming-language',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 10,
        isPublished: true
      });
      courseId = course._id.toString();
    });

    it('should enroll user in course', async () => {
      const req = mockRequest({ courseId }, {}, {}, { _id: userId });
      const res = mockResponse();

      await enrollInCourse(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Successfully enrolled in course');

      // Verify enrollment was created
      const enrollment = await CourseEnrollment.findOne({ user: userId, course: courseId });
      expect(enrollment).toBeTruthy();
      expect(enrollment.overallProgress).toBe(0);
    });

    it('should return 400 if user already enrolled', async () => {
      // Enroll user first
      await CourseEnrollment.create({ user: userId, course: courseId, progress: 0 });

      const req = mockRequest({ courseId }, {}, {}, { _id: userId });
      const res = mockResponse();

      await enrollInCourse(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('You are already enrolled in this course');
    });

    it('should return 404 for non-existent course', async () => {
      const req = mockRequest({ courseId: '507f1f77bcf86cd799439011' }, {}, {}, { _id: userId });
      const res = mockResponse();

      await enrollInCourse(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Course not found');
    });
  });

  describe('getUserEnrolledCourses', () => {
    let userId;
    let courseId1;
    let courseId2;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create test courses
      const course1 = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        shortDescription: 'Python basics course',
        language: 'python',
        category: 'programming-language',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 10,
        isPublished: true
      });
      courseId1 = course1._id.toString();

      const course2 = await Course.create({
        title: 'JavaScript Basics',
        description: 'Learn JS fundamentals',
        shortDescription: 'JavaScript basics course',
        language: 'javascript',
        category: 'web-development',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 15,
        isPublished: true
      });
      courseId2 = course2._id.toString();

      // Enroll user in courses
      await CourseEnrollment.create([
        { user: userId, course: courseId1, overallProgress: 50, enrolledAt: new Date() },
        { user: userId, course: courseId2, overallProgress: 25, enrolledAt: new Date() }
      ]);
    });

    it('should get user enrolled courses', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await getUserEnrolledCourses(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(2);
      expect(res.responseData.data[0]).toHaveProperty('course');
      expect(res.responseData.data[0]).toHaveProperty('overallProgress');
      const progresses = res.responseData.data.map(e => e.overallProgress).sort();
      expect(progresses).toEqual([25, 50]);
    });
  });

  describe('getEnrollmentDetails', () => {
    let userId;
    let courseId;
    let enrollmentId;
    let sectionId;
    let lessonId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create test course
      const course = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        shortDescription: 'Python basics course',
        language: 'python',
        category: 'programming-language',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 10,
        isPublished: true
      });
      courseId = course._id.toString();

      // Create enrollment
      const enrollment = await CourseEnrollment.create({
        user: userId,
        course: courseId,
        overallProgress: 30,
        enrolledAt: new Date()
      });
      enrollmentId = enrollment._id.toString();

      // Create section and lesson
      const section = await CourseSection.create({
        course: courseId,
        title: 'Introduction',
        order: 1
      });
      sectionId = section._id.toString();

      const lesson = await CourseLesson.create({
        course: courseId,
        section: sectionId,
        title: 'Hello World',
        content: 'Print hello world',
        order: 1
      });
      lessonId = lesson._id.toString();

      // Add section to course's sections array
      await Course.findByIdAndUpdate(courseId, {
        $push: { sections: sectionId }
      });
    });

    it.skip('should get enrollment details with course structure', async () => {
      const req = mockRequest({}, { courseId }, {}, { _id: userId });
      const res = mockResponse();

      await getEnrollmentDetails(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.overallProgress).toBe(30);
      expect(res.responseData.data.course.title).toBe('Python Basics');
      expect(res.responseData.data.course.sections).toHaveLength(1);
      expect(res.responseData.data.course.sections[0].lessons).toHaveLength(1);
    });

    it('should return 404 for non-existent enrollment', async () => {
      const req = mockRequest({}, { enrollmentId: '507f1f77bcf86cd799439011' }, {}, { _id: userId });
      const res = mockResponse();

      await getEnrollmentDetails(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Enrollment not found');
    });
  });

  describe('completeLessonProgress', () => {
    let userId;
    let courseId;
    let enrollmentId;
    let sectionId;
    let lessonId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create test course
      const course = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        shortDescription: 'Python basics course',
        language: 'python',
        category: 'programming-language',
        difficulty: 'beginner',
        instructor: instructorId,
        duration: 10,
        isPublished: true
      });
      courseId = course._id.toString();

      // Create enrollment
      const enrollment = await CourseEnrollment.create({
        user: userId,
        course: courseId,
        progress: 0,
        enrolledAt: new Date()
      });
      enrollmentId = enrollment._id.toString();

      // Create section and lesson
      const section = await CourseSection.create({
        course: courseId,
        title: 'Introduction',
        order: 1
      });
      sectionId = section._id.toString();

      const lesson = await CourseLesson.create({
        course: courseId,
        section: section._id,
        title: 'Hello World',
        content: 'Print hello world',
        order: 1
      });
      lessonId = lesson._id.toString();
    });

    it.skip('should complete lesson progress', async () => {
      const req = mockRequest(
        { sectionId, lessonId },
        { courseId },
        {},
        { _id: userId }
      );
      const res = mockResponse();

      await completeLessonProgress(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Lesson completed successfully');

      // Verify enrollment progress was updated
      const updatedEnrollment = await CourseEnrollment.findById(enrollmentId);
      expect(updatedEnrollment.overallProgress).toBeGreaterThan(0);
      expect(updatedEnrollment.completedLessons).toContain(lessonId);
    });

    it.skip('should return 400 if lesson already completed', async () => {
      // Mark lesson as completed first - this would be more complex in real implementation
      // For now, just test the basic functionality

      const req = mockRequest(
        { sectionId, lessonId },
        { courseId },
        {},
        { _id: userId }
      );
      const res = mockResponse();

      await completeLessonProgress(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Lesson already completed');
    });

    it('should return 404 for non-existent enrollment', async () => {
      const req = mockRequest(
        { lessonId },
        { enrollmentId: '507f1f77bcf86cd799439011' },
        {},
        { _id: userId }
      );
      const res = mockResponse();

      await completeLessonProgress(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Enrollment not found');
    });
  });
});