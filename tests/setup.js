import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "@jest/globals";

beforeAll(async () => {
  // Connect to the in-memory database (for unit tests that don't start the app)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  // Clean up database connections
  await mongoose.disconnect();
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
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRES_IN = "7d";
process.env.JWT_COOKIE_EXPIRES_IN = "7";
process.env.FRONTEND_URL = "http://localhost:5173";
