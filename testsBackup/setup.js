import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer;

beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up database connections
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean up all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock console methods to reduce test noise (jest is automatically available in test environment)
// We'll skip mocking console for now to avoid jest reference issues

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_COOKIE_EXPIRES_IN = '7';
process.env.FRONTEND_URL = 'http://localhost:5173';