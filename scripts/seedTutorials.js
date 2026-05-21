// Seed pre-generated tutorials into MongoDB.
//   node scripts/seedTutorials.js          # only seeds if collection is empty
//   node scripts/seedTutorials.js --force  # wipes pre-generated tutorials, then re-seeds

import mongoose from "mongoose";
import dotenv from "dotenv";
import Tutorial from "../src/models/Tutorial.js";
import { preGeneratedTutorials } from "../src/utils/tutorialSeedData.js";

dotenv.config();

const FORCE = process.argv.includes("--force");

const seedTutorials = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/learncode-ai";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const existingCount = await Tutorial.countDocuments({ isPreGenerated: true });

    if (existingCount > 0 && !FORCE) {
      console.log(`⚠️  ${existingCount} pre-generated tutorials already exist.`);
      console.log("    Re-run with --force to wipe and re-seed.");
      await mongoose.connection.close();
      return;
    }

    if (FORCE && existingCount > 0) {
      const deleted = await Tutorial.deleteMany({ isPreGenerated: true });
      console.log(`🧹 Removed ${deleted.deletedCount} stale pre-generated tutorials.`);
    }

    const result = await Tutorial.insertMany(preGeneratedTutorials);
    console.log(`✅ Seeded ${result.length} tutorials.`);

    // Breakdown per language
    const byLang = await Tutorial.aggregate([
      { $match: { isPreGenerated: true } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    console.log("\n📊 Tutorials by language:");
    byLang.forEach((row) => console.log(`   ${row._id}: ${row.count}`));

    // Per-language difficulty breakdown
    const byLevel = await Tutorial.aggregate([
      { $match: { isPreGenerated: true } },
      {
        $group: {
          _id: { language: "$language", difficulty: "$difficulty" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.language": 1, "_id.difficulty": 1 } },
    ]);
    console.log("\n🎯 By language × difficulty:");
    byLevel.forEach((row) =>
      console.log(`   ${row._id.language} / ${row._id.difficulty}: ${row.count}`)
    );

    await mongoose.connection.close();
    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding tutorials:", error);
    process.exit(1);
  }
};

seedTutorials();
