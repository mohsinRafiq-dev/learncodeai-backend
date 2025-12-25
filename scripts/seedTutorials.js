import mongoose from "mongoose";
import dotenv from "dotenv";
import Tutorial from "../src/models/Tutorial.js";
import preGeneratedTutorials from "../src/utils/tutorialSeedData.js";

dotenv.config();

const seedTutorials = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.DB_URI || "mongodb://localhost:27017/learncode-ai",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("✅ Connected to MongoDB");

    // Check if tutorials already exist
    const existingCount = await Tutorial.countDocuments({
      isPreGenerated: true,
    });

    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} pre-generated tutorials already exist`);
      console.log("Skipping seed to avoid duplicates...");
      await mongoose.connection.close();
      return;
    }

    // Insert tutorials
    const result = await Tutorial.insertMany(preGeneratedTutorials);

    console.log(`✅ Successfully seeded ${result.length} tutorials`);

    // Count by language
    const pythonCount = await Tutorial.countDocuments({
      language: "python",
      isPreGenerated: true,
    });
    const cppCount = await Tutorial.countDocuments({
      language: "cpp",
      isPreGenerated: true,
    });
    const jsCount = await Tutorial.countDocuments({
      language: "javascript",
      isPreGenerated: true,
    });

    console.log("\n📊 Tutorials by Language:");
    console.log(`   Python: ${pythonCount}`);
    console.log(`   C++: ${cppCount}`);
    console.log(`   JavaScript: ${jsCount}`);

    // List concepts per language
    const pythonConcepts = await Tutorial.distinct("concept", {
      language: "python",
      isPreGenerated: true,
    });
    const cppConcepts = await Tutorial.distinct("concept", {
      language: "cpp",
      isPreGenerated: true,
    });
    const jsConcepts = await Tutorial.distinct("concept", {
      language: "javascript",
      isPreGenerated: true,
    });

    console.log("\n🎯 Concepts by Language:");
    console.log(`   Python: ${pythonConcepts.join(", ")}`);
    console.log(`   C++: ${cppConcepts.join(", ")}`);
    console.log(`   JavaScript: ${jsConcepts.join(", ")}`);

    await mongoose.connection.close();
    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding tutorials:", error);
    process.exit(1);
  }
};

seedTutorials();
