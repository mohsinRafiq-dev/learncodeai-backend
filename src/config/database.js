import mongoose from "mongoose";
import dotenv from "dotenv";

// Only load .env if MONGODB_URI is not already set (e.g., by test setup)
if (!process.env.MONGODB_URI) {
  dotenv.config();
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/learncode-ai",
      {
        // These options are no longer needed in Mongoose 6+
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
