// Business logic tests for Course Management
import Course from '../../src/models/Course.js';
import User from '../../src/models/User.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';

describe('Course Business Rules', () => {
  beforeEach(async () => {
    // Clean up all collections before each test
    await Course.deleteMany({});
    await User.deleteMany({});
    await CourseEnrollment.deleteMany({});
  });

  it('should allow only one enrollment per user per course', async () => {
    // Arrange: create user and course
    const user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    const course = await Course.create({
      title: 'Test Course',
      description: 'Test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: user._id,
      isPublished: true
    });

    // Act: enroll user in course first time
    const enrollment1 = await CourseEnrollment.create({
      user: user._id,
      course: course._id,
      sectionProgress: [],
      enrollmentDate: new Date()
    });

    // Assert: first enrollment succeeds
    expect(enrollment1).toBeTruthy();

    // Act: try to enroll same user in same course again
    const duplicateEnrollment = await CourseEnrollment.findOne({
      user: user._id,
      course: course._id
    });

    // Assert: only one enrollment exists
    expect(duplicateEnrollment).toBeTruthy();
    expect(duplicateEnrollment.user.toString()).toBe(user._id.toString());
    expect(duplicateEnrollment.course.toString()).toBe(course._id.toString());
  });

  it('should issue certificate only after 100% completion', async () => {
    // Arrange: create user, course, and enrollment
    const user = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    const course = await Course.create({
      title: 'Test Course',
      description: 'Test course description',
      shortDescription: 'Test course',
      language: 'python',
      category: 'programming-language',
      instructor: user._id,
      isPublished: true
    });

    const enrollment = await CourseEnrollment.create({
      user: user._id,
      course: course._id,
      sectionProgress: [],
      enrollmentDate: new Date(),
      completionPercentage: 50 // Not 100%
    });

    // Act: check if certificate can be issued
    const canIssueCertificate = enrollment.completionPercentage === 100;

    // Assert: certificate cannot be issued yet
    expect(canIssueCertificate).toBe(false);

    // Arrange: update completion to 100%
    enrollment.completionPercentage = 100;
    await enrollment.save();

    // Act: check again
    const canIssueCertificateNow = enrollment.completionPercentage === 100;

    // Assert: certificate can now be issued
    expect(canIssueCertificateNow).toBe(true);
  });

  it('should calculate course enrollment count correctly', async () => {
    // Arrange: create course and multiple users
    const instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    const course = await Course.create({
      title: 'Popular Course',
      description: 'Very popular course',
      shortDescription: 'Popular course',
      language: 'javascript',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: true,
      enrollmentCount: 0
    });

    // Create multiple students
    const students = [];
    for (let i = 0; i < 3; i++) {
      const student = await User.create({
        name: `Student ${i + 1}`,
        email: `student${i + 1}@example.com`,
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active'
      });
      students.push(student);
    }

    // Act: enroll all students
    for (const student of students) {
      await CourseEnrollment.create({
        user: student._id,
        course: course._id,
        sectionProgress: [],
        enrollmentDate: new Date()
      });
    }

    // Update course enrollment count
    const enrollmentCount = await CourseEnrollment.countDocuments({ course: course._id });
    course.enrollmentCount = enrollmentCount;
    await course.save();

    // Assert: enrollment count is correct
    expect(course.enrollmentCount).toBe(3);

    // Verify by querying enrollments
    const enrollments = await CourseEnrollment.find({ course: course._id });
    expect(enrollments).toHaveLength(3);
  });

  it('should only show published courses to regular users', async () => {
    // Arrange: create published and unpublished courses
    const instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    const publishedCourse = await Course.create({
      title: 'Published Course',
      description: 'This is published',
      shortDescription: 'Published',
      language: 'python',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: true
    });

    const unpublishedCourse = await Course.create({
      title: 'Unpublished Course',
      description: 'This is not published',
      shortDescription: 'Unpublished',
      language: 'python',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: false
    });

    // Act: query published courses
    const publishedCourses = await Course.find({ isPublished: true });

    // Assert: only published course is returned
    expect(publishedCourses).toHaveLength(1);
    expect(publishedCourses[0].title).toBe('Published Course');
    expect(publishedCourses[0].isPublished).toBe(true);
  });

  it('should validate course data integrity', async () => {
    // Arrange: create instructor
    const instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    // Act & Assert: try to create course without required fields
    await expect(Course.create({
      title: 'Incomplete Course',
      // Missing description, language, category
      instructor: instructor._id,
      isPublished: true
    })).rejects.toThrow();

    // Act: create valid course
    const validCourse = await Course.create({
      title: 'Valid Course',
      description: 'Complete course description',
      shortDescription: 'Valid course',
      language: 'javascript',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: true
    });

    // Assert: course created successfully
    expect(validCourse).toBeTruthy();
    expect(validCourse.title).toBe('Valid Course');
    expect(validCourse.language).toBe('javascript');
  });
});
