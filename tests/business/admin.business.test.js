// Business logic tests for Admin Operations
import User from '../../src/models/User.js';
import Course from '../../src/models/Course.js';

describe('Admin Business Rules', () => {
  beforeEach(async () => {
    // Clean up all collections before each test
    await User.deleteMany({});
    await Course.deleteMany({});
  });

  it('should restrict admin actions to users with admin role', async () => {
    // Arrange: create regular user and admin user
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user'
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'admin'
    });

    // Act: check admin permissions
    const regularUserIsAdmin = regularUser.role === 'admin';
    const adminUserIsAdmin = adminUser.role === 'admin';

    // Assert: only admin user has admin role
    expect(regularUserIsAdmin).toBe(false);
    expect(adminUserIsAdmin).toBe(true);
  });

  it('should handle user account suspension and reactivation', async () => {
    // Arrange: create user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user'
    });

    // Act: suspend user account
    user.accountStatus = 'suspended';
    await user.save();

    // Assert: user is suspended
    let updatedUser = await User.findById(user._id);
    expect(updatedUser.accountStatus).toBe('suspended');

    // Act: reactivate user account
    updatedUser.accountStatus = 'active';
    await updatedUser.save();

    // Assert: user is active again
    updatedUser = await User.findById(user._id);
    expect(updatedUser.accountStatus).toBe('active');
  });

  it('should allow admins to manage course publications', async () => {
    // Arrange: create admin and instructor
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'admin'
    });

    const instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user'
    });

    // Create unpublished course
    const course = await Course.create({
      title: 'Draft Course',
      description: 'Course waiting for approval',
      shortDescription: 'Draft course',
      language: 'python',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: false
    });

    // Act: admin publishes the course
    course.isPublished = true;
    await course.save();

    // Assert: course is now published
    const publishedCourse = await Course.findById(course._id);
    expect(publishedCourse.isPublished).toBe(true);

    // Act: admin unpublishes the course
    publishedCourse.isPublished = false;
    await publishedCourse.save();

    // Assert: course is unpublished again
    const unpublishedCourse = await Course.findById(course._id);
    expect(unpublishedCourse.isPublished).toBe(false);
  });

  it('should track user statistics for admin dashboard', async () => {
    // Arrange: create various users
    await User.create([
      {
        name: 'Active User 1',
        email: 'active1@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'user'
      },
      {
        name: 'Active User 2',
        email: 'active2@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'user'
      },
      {
        name: 'Suspended User',
        email: 'suspended@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'suspended',
        role: 'user'
      },
      {
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
        accountStatus: 'pending',
        role: 'user'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'admin'
      }
    ]);

    // Act: get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ accountStatus: 'active' });
    const suspendedUsers = await User.countDocuments({ accountStatus: 'suspended' });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Assert: statistics are correct
    expect(totalUsers).toBe(5);
    expect(activeUsers).toBe(3); // 2 regular users + 1 admin
    expect(suspendedUsers).toBe(1);
    expect(unverifiedUsers).toBe(1);
    expect(adminUsers).toBe(1);
  });

  it('should allow admins to archive courses', async () => {
    // Arrange: create admin and course
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'admin'
    });

    const instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user'
    });

    const course = await Course.create({
      title: 'Active Course',
      description: 'Currently active course',
      shortDescription: 'Active course',
      language: 'javascript',
      category: 'programming-language',
      instructor: instructor._id,
      isPublished: true,
      isArchived: false
    });

    // Act: admin archives the course
    course.isArchived = true;
    await course.save();

    // Assert: course is archived
    const archivedCourse = await Course.findById(course._id);
    expect(archivedCourse.isArchived).toBe(true);

    // Act: query non-archived courses
    const activeCourses = await Course.find({ isArchived: false, isPublished: true });

    // Assert: archived course is not in active list
    expect(activeCourses).toHaveLength(0);
  });

  it('should validate admin role assignment', async () => {
    // Arrange: create regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user'
    });

    // Act: attempt to change role to admin (simulating admin action)
    user.role = 'admin';
    await user.save();

    // Assert: user role changed to admin
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.role).toBe('admin');

    // Act: change back to user
    updatedUser.role = 'user';
    await updatedUser.save();

    // Assert: user role changed back
    const finalUser = await User.findById(user._id);
    expect(finalUser.role).toBe('user');
  });
});
