// Integration tests for Tutorial Routes
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Tutorial from '../../src/models/Tutorial.js';
import UserSavedTutorial from '../../src/models/UserSavedTutorial.js';

describe('Tutorial Routes', () => {
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

  it('should fetch tutorials by language via API', async () => {
    // Act: GET /api/tutorials?language=python
    const response = await request(app)
      .get('/api/tutorials?language=python')
      .expect(200);

    // Assert: tutorials returned
    console.log('Response body:', response.body); // Debug
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    // Verify all returned tutorials are Python
    response.body.data.forEach(tutorial => {
      expect(tutorial.language).toBe('python');
    });

    // Check that our test tutorial is included
    const tutorialTitles = response.body.data.map(t => t.title);
    expect(tutorialTitles).toContain('Test Tutorial 1 - Python Variables');
  });

  it('should allow user to save tutorial', async () => {
    // Act: POST /api/tutorials/save
    const saveResponse = await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Assert: tutorial saved for user
    expect(saveResponse.body.success).toBe(true);
    expect(saveResponse.body.message).toContain('Tutorial saved successfully');

    // Verify in database
    const savedTutorial = await UserSavedTutorial.findOne({
      userId: testUser._id,
      tutorialId: testTutorial1._id
    });
    expect(savedTutorial).toBeTruthy();
  });

  it('should get tutorial by ID', async () => {
    // Act: GET /api/tutorials/:id
    const response = await request(app)
      .get(`/api/tutorials/${testTutorial1._id}`)
      .expect(200);

    // Assert: tutorial details returned
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(testTutorial1._id.toString());
    expect(response.body.data.title).toBe(testTutorial1.title);
    expect(response.body.data.content).toBe(testTutorial1.content);
    expect(response.body.data.language).toBe(testTutorial1.language);
  });

  it('should get all tutorials with filters', async () => {
    // Act: GET /api/tutorials with difficulty filter
    const response = await request(app)
      .get('/api/tutorials?difficulty=beginner')
      .expect(200);

    // Assert: filtered tutorials returned
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    // All returned tutorials should be beginner level
    response.body.data.forEach(tutorial => {
      expect(tutorial.difficulty).toBe('beginner');
    });
  });

  it('should get available languages', async () => {
    // Act: GET /api/tutorials/languages
    const response = await request(app)
      .get('/api/tutorials/languages')
      .expect(200);

    // Assert: languages list returned
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    // Should include our test languages
    const languageList = response.body.data;
    expect(languageList).toContain('python');
    expect(languageList).toContain('javascript');
  });

  it('should get concepts by language', async () => {
    // Act: GET /api/tutorials/concepts/python
    const response = await request(app)
      .get('/api/tutorials/concepts/python')
      .expect(200);

    // Assert: concepts returned
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.concepts)).toBe(true);

    // Should include 'Variables' from our test tutorial
    expect(response.body.concepts).toContain('Variables');
  });

  it('should get user saved tutorials', async () => {
    // First save a tutorial
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Act: GET /api/tutorials/user/saved
    const response = await request(app)
      .get('/api/tutorials/user/saved')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Assert: saved tutorials returned
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);

    const savedTutorial = response.body.data[0];
    expect(savedTutorial.tutorial._id.toString()).toBe(testTutorial1._id.toString());
    expect(savedTutorial.tutorial.title).toBe(testTutorial1.title);
  });

  it('should unsave tutorial', async () => {
    // First save a tutorial
    await request(app)
      .post('/api/tutorials/save')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tutorialId: testTutorial1._id })
      .expect(201);

    // Act: DELETE /api/tutorials/saved/:tutorialId
    const unsaveResponse = await request(app)
      .delete(`/api/tutorials/saved/${testTutorial1._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Assert: tutorial unsaved
    expect(unsaveResponse.body.success).toBe(true);
    expect(unsaveResponse.body.message).toContain('Tutorial unsaved successfully');

    // Verify in database
    const savedTutorial = await UserSavedTutorial.findOne({
      userId: testUser._id,
      tutorialId: testTutorial1._id
    });
    expect(savedTutorial).toBeNull();
  });

  it('should filter tutorials by concept', async () => {
    // Act: GET /api/tutorials?language=python&concept=Variables
    const response = await request(app)
      .get('/api/tutorials?language=python&concept=Variables')
      .expect(200);

    // Assert: filtered tutorials returned
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    // All returned tutorials should match the filters
    response.body.data.forEach(tutorial => {
      expect(tutorial.language).toBe('python');
      expect(tutorial.concept.toLowerCase()).toContain('variables');
    });
  });
});
