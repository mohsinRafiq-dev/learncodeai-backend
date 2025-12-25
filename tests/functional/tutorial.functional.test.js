// Functional tests for Tutorial Management - End-to-End Workflows
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';
import UserSavedTutorial from '../../src/models/UserSavedTutorial.js';

describe('Tutorial Functional Tests', () => {
  let testUser;
  let testTutorial1;
  let testTutorial2;
  let authToken;

  beforeEach(async () => {
    // Clean up test data
    await UserSavedTutorial.deleteMany({ userId: testUser?._id });
    await Tutorial.deleteMany({ title: /Test Tutorial/ });
    await User.deleteMany({ email: /testtutorial.*@example\.com/ });

    // Create test user
    testUser = new User({
      name: 'Tutorial Test User',
      email: 'testtutorial@example.com',
      password: 'password123',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await testUser.save();

    // Create test tutorials
    testTutorial1 = new Tutorial({
      title: 'Test Tutorial 1 - Python Variables',
      description: 'Learn about Python variables',
      content: 'Variables are containers for storing data values.',
      language: 'python',
      concept: 'Variables',
      difficulty: 'beginner',
      isPreGenerated: true,
      codeExamples: [
        {
          title: 'Variable Declaration',
          description: 'How to declare variables in Python',
          code: 'name = "John"\nage = 25',
          input: '',
          expectedOutput: '',
          order: 1
        }
      ]
    });
    await testTutorial1.save();

    testTutorial2 = new Tutorial({
      title: 'Test Tutorial 2 - JavaScript Functions',
      description: 'Learn about JavaScript functions',
      content: 'Functions are blocks of code designed to perform particular tasks.',
      language: 'javascript',
      concept: 'Functions',
      difficulty: 'intermediate',
      isPreGenerated: true,
      codeExamples: [
        {
          title: 'Function Declaration',
          description: 'How to declare functions in JavaScript',
          code: 'function greet(name) {\n  return "Hello " + name;\n}',
          input: '',
          expectedOutput: '',
          order: 1
        }
      ]
    });
    await testTutorial2.save();

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
    await UserSavedTutorial.deleteMany({ userId: testUser?._id });
    await Tutorial.deleteMany({ title: /Test Tutorial/ });
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
  });

  it('should display tutorials by selected language', async () => {
    // Step 1: Browse all tutorials
    const allTutorialsResponse = await request(app)
      .get('/api/tutorials')
      .expect(200);

    expect(allTutorialsResponse.body.success).toBe(true);
    expect(Array.isArray(allTutorialsResponse.body.data)).toBe(true);
    expect(allTutorialsResponse.body.data.length).toBeGreaterThanOrEqual(2);

    // Step 2: Filter by Python language
    const pythonTutorialsResponse = await request(app)
      .get('/api/tutorials/language/python')
      .expect(200);

    expect(pythonTutorialsResponse.body.success).toBe(true);
    expect(pythonTutorialsResponse.body.language).toBe('python');
    expect(typeof pythonTutorialsResponse.body.tutorials).toBe('object');

    // Verify all returned tutorials are Python
    Object.values(pythonTutorialsResponse.body.tutorials).forEach(conceptTutorials => {
      conceptTutorials.forEach(tutorial => {
        expect(tutorial.language).toBe('python');
      });
    });

    // Step 3: Filter by JavaScript language
    const jsTutorialsResponse = await request(app)
      .get('/api/tutorials/language/javascript')
      .expect(200);

    expect(jsTutorialsResponse.body.success).toBe(true);
    expect(typeof jsTutorialsResponse.body.tutorials).toBe('object');

    // Verify all returned tutorials are JavaScript (flatten the grouped structure)
    Object.values(jsTutorialsResponse.body.tutorials).forEach(conceptTutorials => {
      conceptTutorials.forEach(tutorial => {
        expect(tutorial.language).toBe('javascript');
      });
    });

    // Step 4: Get available languages
    const languagesResponse = await request(app)
      .get('/api/tutorials/languages')
      .expect(200);

    expect(languagesResponse.body.success).toBe(true);
    expect(Array.isArray(languagesResponse.body.data)).toBe(true);
    expect(languagesResponse.body.data).toContain('python');
    expect(languagesResponse.body.data).toContain('javascript');
  });

  it('should allow user to save tutorial', async () => {
    // Step 1: View tutorial details
    const tutorialDetailResponse = await request(app)
      .get(`/api/tutorials/${testTutorial1._id}`)
      .expect(200);

    expect(tutorialDetailResponse.body.success).toBe(true);
    expect(tutorialDetailResponse.body.data._id).toBe(testTutorial1._id.toString());
    expect(tutorialDetailResponse.body.data.title).toBe(testTutorial1.title);

    // Step 2: Save the tutorial
    const saveResponse = await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    expect(saveResponse.body.success).toBe(true);
    expect(saveResponse.body.message).toContain('Tutorial saved successfully');

    // Step 3: Verify tutorial appears in saved tutorials
    const savedTutorialsResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedTutorialsResponse.body.success).toBe(true);
    expect(Array.isArray(savedTutorialsResponse.body.data)).toBe(true);
    expect(savedTutorialsResponse.body.data.length).toBe(1);

    const savedTutorial = savedTutorialsResponse.body.data[0];
    expect(savedTutorial.tutorial._id.toString()).toBe(testTutorial1._id.toString());
    expect(savedTutorial.tutorial.title).toBe(testTutorial1.title);

    // Step 4: Try to save the same tutorial again (should fail)
    const duplicateSaveResponse = await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(400);

    expect(duplicateSaveResponse.body.success).toBe(false);
    expect(duplicateSaveResponse.body.message).toContain('already saved');
  });

  it('should allow user to unsave tutorial', async () => {
    // First save a tutorial
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Verify it's saved
    let savedResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedResponse.body.data.length).toBe(1);

    // Step 1: Unsave the tutorial
    const unsaveResponse = await request(app)
      .delete(`/api/tutorials/saved/${testTutorial1._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(unsaveResponse.body.success).toBe(true);
    expect(unsaveResponse.body.message).toContain('Tutorial unsaved successfully');

    // Step 2: Verify tutorial is no longer in saved list
    savedResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedResponse.body.data.length).toBe(0);

    // Step 3: Try to unsave again (should fail)
    const duplicateUnsaveResponse = await request(app)
      .delete(`/api/tutorials/saved/${testTutorial1._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(duplicateUnsaveResponse.body.success).toBe(false);
    expect(duplicateUnsaveResponse.body.message).toContain('Saved tutorial not found');
  });

  it('should handle multiple saved tutorials', async () => {
    // Save first tutorial
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Save second tutorial
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial2._id })
      .expect(201);

    // Verify both are saved
    const savedResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedResponse.body.data.length).toBe(2);

    const savedIds = savedResponse.body.data.map(item => item.tutorial._id.toString());
    expect(savedIds).toContain(testTutorial1._id.toString());
    expect(savedIds).toContain(testTutorial2._id.toString());

    // Unsave first tutorial
    await request(app)
      .delete(`/api/tutorials/saved/${testTutorial1._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify only second tutorial remains
    const updatedSavedResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(updatedSavedResponse.body.data.length).toBe(1);
    expect(updatedSavedResponse.body.data[0].tutorial._id.toString()).toBe(testTutorial2._id.toString());
  });

  it('should filter tutorials by concept', async () => {
    // Get concepts for Python
    const conceptsResponse = await request(app)
      .get('/api/tutorials/concepts/python')
      .expect(200);

    expect(conceptsResponse.body.success).toBe(true);
    expect(Array.isArray(conceptsResponse.body.concepts)).toBe(true);
    expect(conceptsResponse.body.concepts).toContain('Variables');

    // Filter tutorials by concept
    const conceptTutorialsResponse = await request(app)
      .get('/api/tutorials?language=python&concept=Variables')
      .expect(200);

    expect(conceptTutorialsResponse.body.success).toBe(true);
    expect(Array.isArray(conceptTutorialsResponse.body.data)).toBe(true);

    // Verify all returned tutorials match the concept
    conceptTutorialsResponse.body.data.forEach(tutorial => {
      expect(tutorial.language).toBe('python');
      expect(tutorial.concept.toLowerCase()).toContain('variables');
    });
  });

  it('should handle tutorial progress tracking', async () => {
    // Save tutorial first
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Update progress (mark as completed)
    const progressResponse = await request(app)
      .put(`/api/tutorials/progress/${testTutorial1._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        isCompleted: true,
        rating: 5,
        notes: 'Great tutorial!'
      })
      .expect(200);

    expect(progressResponse.body.success).toBe(true);
    expect(progressResponse.body.message).toContain('Tutorial progress updated');

    // Verify progress is saved
    const savedTutorialsResponse = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(savedTutorialsResponse.body.data.length).toBe(1);
    const savedTutorial = savedTutorialsResponse.body.data[0];

    expect(savedTutorial.progress.isCompleted).toBe(true);
    expect(savedTutorial.progress.rating).toBe(5);
    expect(savedTutorial.progress.notes).toBe('Great tutorial!');
    expect(savedTutorial.progress.completedAt).toBeDefined();
  });
});
