import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Set up in-memory MongoDB for all tests
let mongoServer;

export default async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set the MONGODB_URI environment variable so the app connects to in-memory DB
  process.env.MONGODB_URI = mongoUri;

  // Store the server instance globally so teardown can access it
  global.__MONGOSERVER__ = mongoServer;
};