// Integration tests for Admin Routes
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';

describe('Admin Routes', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularUserToken;
  let testTutorial;

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: /testadmin.*@example\.com/ });
    await Tutorial.deleteMany({ title: /Admin Test Tutorial/ });

    // Create admin user
    adminUser = new User({
      name: 'Admin Test User',
      email: 'testadmin@example.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await adminUser.save();

    // Create regular user
    regularUser = new User({
      name: 'Regular Test User',
      email: 'testregular@example.com',
      password: 'user123',
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await regularUser.save();

    // Create test tutorial
    testTutorial = new Tutorial({
      title: 'Admin Test Tutorial',
      description: 'Tutorial for admin testing',
      content: 'Test content for admin operations',
      language: 'python',
      concept: 'Testing',
      difficulty: 'beginner',
      isPreGenerated: false
    });
    await testTutorial.save();

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: adminUser.email,
        password: 'admin123'
      });

    adminToken = adminLoginResponse.body.token;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: regularUser.email,
        password: 'user123'
      });

    regularUserToken = userLoginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: /testadmin.*@example\.com/ });
    await Tutorial.deleteMany({ title: /Admin Test Tutorial/ });
  });

  it('should suspend user account via API', async () => {
    // Act: PUT /api/admin/users/:userId/status
    const suspendResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountStatus: 'suspended',
        reason: 'Violation of terms of service'
      })
      .expect(200);

    // Assert: user suspended
    expect(suspendResponse.body.success).toBe(true);
    expect(suspendResponse.body.message).toContain('User status updated to suspended');

    // Verify in database
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.accountStatus).toBe('suspended');
  });

  it('should view analytics data as admin', async () => {
    // Act: GET /api/admin/analytics
    const analyticsResponse = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: analytics data returned
    expect(analyticsResponse.body.success).toBe(true);
    expect(analyticsResponse.body.data).toBeDefined();
  });

  it('should get dashboard stats', async () => {
    // Act: GET /api/admin/stats
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: stats data returned
    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data).toBeDefined();
    expect(typeof statsResponse.body.data.totalUsers).toBe('number');
    expect(typeof statsResponse.body.data.totalTutorials).toBe('number');
    expect(typeof statsResponse.body.data.totalCourses).toBe('number');
  });

  it('should get all users as admin', async () => {
    // Act: GET /api/admin/users
    const usersResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: users list returned
    expect(usersResponse.body.success).toBe(true);
    expect(Array.isArray(usersResponse.body.data)).toBe(true);
    expect(usersResponse.body.data.length).toBeGreaterThanOrEqual(2); // admin + regular user
  });

  it('should get user details as admin', async () => {
    // Act: GET /api/admin/users/:userId
    const userDetailsResponse = await request(app)
      .get(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: user details returned
    expect(userDetailsResponse.body.success).toBe(true);
    expect(userDetailsResponse.body.data._id).toBe(regularUser._id.toString());
    expect(userDetailsResponse.body.data.email).toBe(regularUser.email);
    expect(userDetailsResponse.body.data.name).toBe(regularUser.name);
  });

  it('should update user role as admin', async () => {
    // Act: PUT /api/admin/users/:userId/role
    const roleResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
      .expect(200);

    // Assert: role updated
    expect(roleResponse.body.success).toBe(true);
    expect(roleResponse.body.message).toContain('User role changed to admin');

    // Verify in database
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.role).toBe('admin');
  });

  it('should update user details as admin', async () => {
    // Act: PUT /api/admin/users/:userId
    const updateResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Regular User',
        profilePicture: 'https://example.com/avatar.jpg'
      })
      .expect(200);

    // Assert: user details updated
    expect(updateResponse.body.success).toBe(true);

    // Verify in database
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.name).toBe('Updated Regular User');
  });

  it('should get all tutorials as admin', async () => {
    // Act: GET /api/admin/tutorials
    const tutorialsResponse = await request(app)
      .get('/api/admin/tutorials')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: tutorials list returned
    expect(tutorialsResponse.body.success).toBe(true);
    expect(Array.isArray(tutorialsResponse.body.data)).toBe(true);
  });

  it('should update tutorial as admin', async () => {
    // Act: PUT /api/admin/tutorials/:tutorialId
    const updateResponse = await request(app)
      .put(`/api/admin/tutorials/${testTutorial._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Admin Test Tutorial',
        description: 'Updated description'
      })
      .expect(200);

    // Assert: tutorial updated
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toContain('Tutorial updated successfully');

    // Verify in database
    const updatedTutorial = await Tutorial.findById(testTutorial._id);
    expect(updatedTutorial.title).toBe('Updated Admin Test Tutorial');
    expect(updatedTutorial.description).toBe('Updated description');
  });

  it('should delete tutorial as admin', async () => {
    // Act: DELETE /api/admin/tutorials/:tutorialId
    const deleteResponse = await request(app)
      .delete(`/api/admin/tutorials/${testTutorial._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: tutorial deleted
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toContain('Tutorial deleted successfully');

    // Verify in database
    const deletedTutorial = await Tutorial.findById(testTutorial._id);
    expect(deletedTutorial).toBeNull();
  });

  it('should get recent activity as admin', async () => {
    // Act: GET /api/admin/recent-activity
    const activityResponse = await request(app)
      .get('/api/admin/recent-activity')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: activity data returned
    expect(activityResponse.body.success).toBe(true);
    expect(Array.isArray(activityResponse.body.data)).toBe(true);
  });

  it('should search users as admin', async () => {
    // Act: GET /api/admin/users/search?query=Test
    const searchResponse = await request(app)
      .get('/api/admin/users/search?query=Test')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: search results returned
    expect(searchResponse.body.success).toBe(true);
    expect(Array.isArray(searchResponse.body.data)).toBe(true);
    expect(searchResponse.body.data.length).toBeGreaterThan(0);

    // Should find our regular user
    const userNames = searchResponse.body.data.map(u => u.name);
    expect(userNames).toContain('Regular Test User');
  });

  it('should reject non-admin access to admin routes', async () => {
    // Act: GET /api/admin/stats as regular user
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(403);

    // Assert: access denied
    expect(statsResponse.status).toBe(403);
    expect(statsResponse.body.message).toContain('Admin access required');
  });

  it('should delete user as admin', async () => {
    // Create a user to delete
    const userToDelete = new User({
      name: 'User To Delete',
      email: 'delete@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await userToDelete.save();

    // Act: DELETE /api/admin/users/:userId
    const deleteResponse = await request(app)
      .delete(`/api/admin/users/${userToDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Assert: user deleted
    expect(deleteResponse.body.success).toBe(true);

    // Verify in database
    const deletedUser = await User.findById(userToDelete._id);
    expect(deletedUser).toBeNull();
  });
});
