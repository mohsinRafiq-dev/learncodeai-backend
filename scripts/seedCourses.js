import seedCourses from "../src/utils/courseSeedData.js";
import connectDB from "../src/config/database.js";

// Script to seed courses
const runSeed = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("📡 Connected to database");
    
    // Run seeding
    await seedCourses();
    console.log("✨ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();

