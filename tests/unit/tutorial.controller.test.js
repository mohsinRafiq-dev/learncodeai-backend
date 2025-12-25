// Unit tests for Tutorial Controller
import tutorialController from '../../src/controllers/tutorialController.js';
import Tutorial from '../../src/models/Tutorial.js';
import UserSavedTutorial from '../../src/models/UserSavedTutorial.js';
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

describe('Tutorial Controller', () => {
  beforeEach(async () => {
    // Clean up collections
    await Tutorial.deleteMany({});
    await UserSavedTutorial.deleteMany({});
    await User.deleteMany({});
  });

  describe('getAllTutorials', () => {
    beforeEach(async () => {
      // Create test tutorials
      await Tutorial.create([
        {
          title: 'Python Basics',
          description: 'Learn Python basics',
          language: 'python',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'Python content',
          isPreGenerated: true
        },
        {
          title: 'JavaScript Functions',
          description: 'Learn JavaScript functions',
          language: 'javascript',
          difficulty: 'intermediate',
          concept: 'functions',
          content: 'JS content',
          isPreGenerated: true
        },
        {
          title: 'Java Arrays',
          description: 'Learn Java arrays',
          language: 'cpp',
          difficulty: 'beginner',
          concept: 'arrays',
          content: 'Java content',
          isPreGenerated: false // Not pre-generated
        }
      ]);
    });

    it('should get all pre-generated tutorials', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await tutorialController.getAllTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.count).toBe(2);
      expect(res.responseData.data).toHaveLength(2);
    });

    it('should filter tutorials by language', async () => {
      const req = mockRequest({}, {}, { language: 'python' });
      const res = mockResponse();

      await tutorialController.getAllTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.count).toBe(1);
      expect(res.responseData.data[0].language).toBe('python');
    });

    it('should filter tutorials by difficulty', async () => {
      const req = mockRequest({}, {}, { difficulty: 'beginner' });
      const res = mockResponse();

      await tutorialController.getAllTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.count).toBe(1);
      expect(res.responseData.data[0].difficulty).toBe('beginner');
    });

    it('should filter tutorials by concept', async () => {
      const req = mockRequest({}, {}, { concept: 'functions' });
      const res = mockResponse();

      await tutorialController.getAllTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.count).toBe(1);
      expect(res.responseData.data[0].concept).toBe('functions');
    });
  });

  describe('getTutorialById', () => {
    let tutorialId;

    beforeEach(async () => {
      const tutorial = await Tutorial.create({
        title: 'Python Basics',
        description: 'Learn Python basics',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'Python content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();
    });

    it('should get tutorial by id', async () => {
      const req = mockRequest({}, { id: tutorialId });
      const res = mockResponse();

      await tutorialController.getTutorialById(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data.title).toBe('Python Basics');
    });

    it('should return 404 for non-existent tutorial', async () => {
      const req = mockRequest({}, { id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await tutorialController.getTutorialById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Tutorial not found');
    });
  });

  describe('getTutorialsByLanguage', () => {
    beforeEach(async () => {
      await Tutorial.create([
        {
          title: 'Python Basics',
          description: 'Learn Python basics',
          language: 'python',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'Python content',
          isPreGenerated: true
        },
        {
          title: 'Python Advanced',
          description: 'Learn advanced Python',
          language: 'python',
          difficulty: 'advanced',
          concept: 'decorators',
          content: 'Advanced Python content',
          isPreGenerated: true
        },
        {
          title: 'JavaScript Basics',
          description: 'Learn JavaScript basics',
          language: 'javascript',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'JS content',
          isPreGenerated: true
        }
      ]);
    });

    it('should get tutorials by language', async () => {
      const req = mockRequest({}, { language: 'python' });
      const res = mockResponse();

      await tutorialController.getTutorialsByLanguage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.language).toBe('python');
      expect(res.responseData.conceptCount).toBeGreaterThan(0);
      expect(res.responseData.tutorials).toBeDefined();
    });

    it('should return 400 for invalid language', async () => {
      const req = mockRequest({}, { language: 'ruby' });
      const res = mockResponse();

      await tutorialController.getTutorialsByLanguage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toContain('Invalid language');
    });
  });

  describe('saveTutorial', () => {
    let userId;
    let tutorialId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create test tutorial
      const tutorial = await Tutorial.create({
        title: 'Python Basics',
        description: 'Learn Python basics',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'Python content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();
    });

    it('should save tutorial for user', async () => {
      const req = mockRequest({ tutorialId }, {}, {}, { _id: userId });
      const res = mockResponse();

      await tutorialController.saveTutorial(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Tutorial saved successfully');

      // Verify tutorial was saved
      const savedTutorial = await UserSavedTutorial.findOne({ userId, tutorialId });
      expect(savedTutorial).toBeTruthy();
    });

    it('should return 400 if tutorial already saved', async () => {
      // Save tutorial first
      await UserSavedTutorial.create({ userId, tutorialId });

      const req = mockRequest({ tutorialId }, {}, {}, { _id: userId });
      const res = mockResponse();

      await tutorialController.saveTutorial(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.responseData.success).toBe(false);
      expect(res.responseData.message).toBe('Tutorial already saved');
    });
  });

  describe('getSavedTutorials', () => {
    let userId;
    let tutorialId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create and save tutorial
      const tutorial = await Tutorial.create({
        title: 'Python Basics',
        description: 'Learn Python basics',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'Python content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();

      await UserSavedTutorial.create({ userId, tutorialId });
    });

    it('should get saved tutorials for user', async () => {
      const req = mockRequest({}, {}, {}, { _id: userId });
      const res = mockResponse();

      await tutorialController.getSavedTutorials(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toHaveLength(1);
      expect(res.responseData.data[0].tutorial.title).toBe('Python Basics');
    });
  });

  describe('unsaveTutorial', () => {
    let userId;
    let tutorialId;

    beforeEach(async () => {
      // Create test user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
      userId = user._id.toString();

      // Create and save tutorial
      const tutorial = await Tutorial.create({
        title: 'Python Basics',
        description: 'Learn Python basics',
        language: 'python',
        difficulty: 'beginner',
        concept: 'variables',
        content: 'Python content',
        isPreGenerated: true
      });
      tutorialId = tutorial._id.toString();

      await UserSavedTutorial.create({ userId, tutorialId });
    });

    it('should unsave tutorial for user', async () => {
      const req = mockRequest({}, { tutorialId }, {}, { _id: userId });
      const res = mockResponse();

      await tutorialController.unsaveTutorial(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.message).toBe('Tutorial unsaved successfully');

      // Verify tutorial was unsaved
      const savedTutorial = await UserSavedTutorial.findOne({ userId, tutorialId });
      expect(savedTutorial).toBeNull();
    });
  });

  describe('getConceptsByLanguage', () => {
    beforeEach(async () => {
      await Tutorial.create([
        {
          title: 'Python Basics',
          description: 'Learn Python basics',
          language: 'python',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'Python content',
          isPreGenerated: true
        },
        {
          title: 'Python Functions',
          description: 'Learn Python functions',
          language: 'python',
          difficulty: 'beginner',
          concept: 'functions',
          content: 'Python functions content',
          isPreGenerated: true
        },
        {
          title: 'JavaScript Basics',
          description: 'Learn JavaScript basics',
          language: 'javascript',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'JS content',
          isPreGenerated: true
        }
      ]);
    });

    it('should get concepts by language', async () => {
      const req = mockRequest({}, { language: 'python' });
      const res = mockResponse();

      await tutorialController.getConceptsByLanguage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.concepts).toContain('variables');
      expect(res.responseData.concepts).toContain('functions');
    });
  });

  describe('getLanguages', () => {
    beforeEach(async () => {
      await Tutorial.create([
        {
          title: 'Python Basics',
          description: 'Learn Python basics',
          language: 'python',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'Python content',
          isPreGenerated: true
        },
        {
          title: 'JavaScript Basics',
          description: 'Learn JavaScript basics',
          language: 'javascript',
          difficulty: 'beginner',
          concept: 'variables',
          content: 'JS content',
          isPreGenerated: true
        }
      ]);
    });

    it('should get all available languages', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await tutorialController.getLanguages(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.responseData.success).toBe(true);
      expect(res.responseData.data).toContain('python');
      expect(res.responseData.data).toContain('javascript');
    });
  });
});