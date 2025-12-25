// Functional tests for Admin Operations - End-to-End Workflows
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';

describe('Admin Functional Tests', () => {
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

  it('should allow admin to suspend user', async () => {
    // Step 1: Verify regular user can login initially
    const initialLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: regularUser.email,
        password: 'user123'
      })
      .expect(200);

    expect(initialLoginResponse.body.status).toBe('success');

    // Step 2: Admin suspends the user
    const suspendResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountStatus: 'suspended',
        reason: 'Violation of terms of service'
      })
      .expect(200);

    expect(suspendResponse.body.success).toBe(true);
    expect(suspendResponse.body.message).toContain('User status updated to suspended');

    // Step 3: Verify suspended user cannot login
    const suspendedLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: regularUser.email,
        password: 'user123'
      })
      .expect(403);

    expect(suspendedLoginResponse.body.status).toBe('fail');
    expect(suspendedLoginResponse.body.message).toContain('suspended');

    // Step 4: Admin reactivates the user
    const reactivateResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accountStatus: 'active',
        reason: 'Issue resolved'
      })
      .expect(200);

    expect(reactivateResponse.body.success).toBe(true);
    expect(reactivateResponse.body.message).toContain('User status updated to active');

    // Step 5: Verify reactivated user can login again
    const reactivatedLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: regularUser.email,
        password: 'user123'
      })
      .expect(200);

    expect(reactivatedLoginResponse.body.status).toBe('success');
  });

  it('should show analytics dashboard to admin', async () => {
    // Step 1: Access dashboard stats
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(statsResponse.body.success).toBe(true);
    expect(statsResponse.body.data).toBeDefined();

    // Verify stats structure
    const stats = statsResponse.body.data;
    expect(stats).toHaveProperty('totalUsers');
    expect(stats).toHaveProperty('totalTutorials');
    expect(stats).toHaveProperty('totalCourses');
    expect(stats).toHaveProperty('activeUsers');

    // Values should be numbers (could be 0)
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalTutorials).toBe('number');
    expect(typeof stats.totalCourses).toBe('number');
    expect(typeof stats.activeUsers).toBe('number');

    // Step 2: Access detailed analytics
    const analyticsResponse = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(analyticsResponse.body.success).toBe(true);
    expect(analyticsResponse.body.data).toBeDefined();

    // Step 3: Access recent activity
    const activityResponse = await request(app)
      .get('/api/admin/recent-activity')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(activityResponse.body.success).toBe(true);
    expect(Array.isArray(activityResponse.body.data)).toBe(true);
  });

  it('should allow admin to manage user roles', async () => {
    // Step 1: Verify initial role
    const initialUserDetails = await request(app)
      .get(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(initialUserDetails.body.success).toBe(true);
    expect(initialUserDetails.body.data.role).toBe('user');

    // Step 2: Promote user to admin
    const promoteResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
      .expect(200);

    expect(promoteResponse.body.success).toBe(true);
    expect(promoteResponse.body.message).toContain('User role changed to admin');

    // Step 3: Verify role change
    const updatedUserDetails = await request(app)
      .get(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(updatedUserDetails.body.data.role).toBe('admin');

    // Step 4: Demote back to user
    const demoteResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' })
      .expect(200);

    expect(demoteResponse.body.success).toBe(true);

    // Step 5: Verify demotion
    const finalUserDetails = await request(app)
      .get(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(finalUserDetails.body.data.role).toBe('user');
  });

  it('should prevent non-admin from accessing admin routes', async () => {
    // Try to access admin stats as regular user
    const statsResponse = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .expect(403);

    expect(statsResponse.body.success).toBeUndefined();
    expect(statsResponse.body.message).toContain('Admin access required');

    // Try to suspend another user as regular user
    const suspendResponse = await request(app)
      .put(`/api/admin/users/${adminUser._id}/status`)
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({ accountStatus: 'suspended' })
      .expect(403);

    expect(suspendResponse.body.message).toContain('Admin access required');
  });

  it('should allow admin to manage tutorials', async () => {
    // Step 1: Get all tutorials
    const tutorialsResponse = await request(app)
      .get('/api/admin/tutorials')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(tutorialsResponse.body.success).toBe(true);
    expect(Array.isArray(tutorialsResponse.body.data)).toBe(true);

    // Step 2: Update tutorial
    const updateResponse = await request(app)
      .put(`/api/admin/tutorials/${testTutorial._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Admin Test Tutorial',
        description: 'Updated description'
      })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.message).toContain('Tutorial updated successfully');

    // Step 3: Verify update
    const updatedTutorial = await Tutorial.findById(testTutorial._id);
    expect(updatedTutorial.title).toBe('Updated Admin Test Tutorial');
    expect(updatedTutorial.description).toBe('Updated description');

    // Step 4: Delete tutorial
    const deleteResponse = await request(app)
      .delete(`/api/admin/tutorials/${testTutorial._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toContain('Tutorial deleted successfully');

    // Step 5: Verify deletion
    const deletedTutorial = await Tutorial.findById(testTutorial._id);
    expect(deletedTutorial).toBeNull();
  });

  it('should allow admin to search and view user details', async () => {
    // Step 1: Search users
    const searchResponse = await request(app)
      .get('/api/admin/users/search?query=Regular')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(searchResponse.body.success).toBe(true);
    expect(Array.isArray(searchResponse.body.data)).toBe(true);
    expect(searchResponse.body.data.length).toBeGreaterThan(0);

    // Step 2: Get specific user details
    const userDetailsResponse = await request(app)
      .get(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(userDetailsResponse.body.success).toBe(true);
    expect(userDetailsResponse.body.data._id).toBe(regularUser._id.toString());
    expect(userDetailsResponse.body.data.email).toBe(regularUser.email);
    expect(userDetailsResponse.body.data.name).toBe(regularUser.name);

    // Step 3: Update user details
    const updateDetailsResponse = await request(app)
      .put(`/api/admin/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Regular User',
        profilePicture: 'https://example.com/avatar.jpg'
      })
      .expect(200);

    expect(updateDetailsResponse.body.success).toBe(true);

    // Step 4: Verify update
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.name).toBe('Updated Regular User');
  });

  it('should prevent admin from demoting themselves', async () => {
    // Try to demote self from admin
    const selfDemoteResponse = await request(app)
      .put(`/api/admin/users/${adminUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' })
      .expect(400);

    expect(selfDemoteResponse.body.success).toBe(false);
    expect(selfDemoteResponse.body.message).toContain('Cannot demote yourself');

    // Verify admin role is unchanged
    const adminDetails = await User.findById(adminUser._id);
    expect(adminDetails.role).toBe('admin');
  });
});
