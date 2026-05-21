// Seed the 3 comprehensive courses (Python, JavaScript, C++).
// Idempotent — wipes existing courses with matching title first.
//
//   node scripts/seedCourses.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import seedAllCourses from "../src/utils/seedAllCourses.js";

dotenv.config();

const run = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/learncode-ai";
    await mongoose.connect(uri);
    console.log("📡 Connected to MongoDB");

    await seedAllCourses();

    await mongoose.connection.close();
    console.log("✨ Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

run();
