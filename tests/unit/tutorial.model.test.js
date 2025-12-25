// Unit tests for Tutorial Model
import Tutorial from '../../src/models/Tutorial.js';
import User from '../../src/models/User.js';

describe('Tutorial Model', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for tutorials
    testUser = new User({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123'
    });
    await testUser.save();
  });

  it('should create tutorial with valid data', async () => {
    // Arrange: valid tutorial data
    const tutorialData = {
      title: 'Variables in Python',
      description: 'Learn about variables in Python programming',
      content: 'Variables are containers for storing data values...',
      language: 'python',
      concept: 'Variables',
      difficulty: 'beginner',
      createdBy: testUser._id
    };

    // Act: create tutorial
    const tutorial = new Tutorial(tutorialData);
    const savedTutorial = await tutorial.save();

    // Assert: tutorial created
    expect(savedTutorial._id).toBeDefined();
    expect(savedTutorial.title).toBe(tutorialData.title);
    expect(savedTutorial.description).toBe(tutorialData.description);
    expect(savedTutorial.language).toBe(tutorialData.language);
    expect(savedTutorial.concept).toBe(tutorialData.concept);
    expect(savedTutorial.isPreGenerated).toBe(true); // default value
  });

  it('should create tutorial with code examples', async () => {
    // Arrange: tutorial with code examples
    const tutorialData = {
      title: 'Functions in Python',
      description: 'Learn about functions',
      content: 'Functions are reusable blocks of code...',
      concept: 'Functions',
      codeExamples: [
        {
          title: 'Simple Function',
          description: 'A basic function example',
          code: 'def greet(name):\n    return f"Hello, {name}!"',
          input: 'greet("World")',
          expectedOutput: 'Hello, World!',
          order: 1
        }
      ]
    };

    // Act: create tutorial
    const tutorial = new Tutorial(tutorialData);
    const savedTutorial = await tutorial.save();

    // Assert: tutorial with code examples created
    expect(savedTutorial.codeExamples).toHaveLength(1);
    expect(savedTutorial.codeExamples[0].title).toBe('Simple Function');
    expect(savedTutorial.codeExamples[0].code).toContain('def greet');
  });

  it('should reject tutorial with missing required fields', async () => {
    // Arrange: missing title
    const invalidTutorialData = {
      description: 'Learn about variables',
      content: 'Variables are containers...',
      concept: 'Variables'
    };

    // Act & Assert: should throw validation error
    const tutorial = new Tutorial(invalidTutorialData);
    await expect(tutorial.save()).rejects.toThrow();
  });

  it('should reject tutorial with invalid language', async () => {
    // Arrange: invalid language
    const invalidTutorialData = {
      title: 'Test Tutorial',
      description: 'Test description',
      content: 'Test content',
      concept: 'Test Concept',
      language: 'invalid-lang'
    };

    // Act & Assert: should throw validation error
    const tutorial = new Tutorial(invalidTutorialData);
    await expect(tutorial.save()).rejects.toThrow();
  });
});
