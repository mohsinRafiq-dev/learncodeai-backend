// Unit tests for Course Model
import Course from '../../src/models/Course.js';
import User from '../../src/models/User.js';

describe('Course Model', () => {
  let testInstructor;

  beforeEach(async () => {
    // Create a test instructor for all tests
    testInstructor = new User({
      name: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'password123'
    });
    await testInstructor.save();
  });

  it('should create course with valid data', async () => {
    // Arrange: valid course data
    const courseData = {
      title: 'Test Course',
      description: 'This is a test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      difficulty: 'beginner',
      instructor: testInstructor._id
    };

    // Act: create course
    const course = new Course(courseData);
    const savedCourse = await course.save();

    // Assert: course created
    expect(savedCourse._id).toBeDefined();
    expect(savedCourse.title).toBe(courseData.title);
    expect(savedCourse.description).toBe(courseData.description);
    expect(savedCourse.language).toBe(courseData.language);
    expect(savedCourse.category).toBe(courseData.category);
    expect(savedCourse.isPublished).toBe(false); // default value
  });

  it('should reject course with missing required fields', async () => {
    // Arrange: missing title
    const invalidCourseData = {
      description: 'This is a test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: testInstructor._id
    };

    // Act & Assert: should throw validation error
    const course = new Course(invalidCourseData);
    await expect(course.save()).rejects.toThrow();
  });

  it('should reject course with invalid language', async () => {
    // Arrange: invalid language
    const invalidCourseData = {
      title: 'Test Course',
      description: 'This is a test course description',
      shortDescription: 'Test course',
      language: 'invalid-language',
      category: 'programming-language',
      instructor: testInstructor._id
    };

    // Act & Assert: should throw validation error
    const course = new Course(invalidCourseData);
    await expect(course.save()).rejects.toThrow();
  });

  it('should reject course with title too long', async () => {
    // Arrange: title exceeding maxlength
    const longTitle = 'a'.repeat(101); // 101 characters
    const invalidCourseData = {
      title: longTitle,
      description: 'This is a test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: testInstructor._id
    };

    // Act & Assert: should throw validation error
    const course = new Course(invalidCourseData);
    await expect(course.save()).rejects.toThrow();
  });
});
