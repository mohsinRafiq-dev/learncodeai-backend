import mongoose from "mongoose";
import dotenv from "dotenv";
import gamificationService from "../src/services/gamificationService.js";
import UserGamification from "../src/models/UserGamification.js";
import User from "../src/models/User.js";
import Badge from "../src/models/Badge.js";
import Streak from "../src/models/Streak.js";

dotenv.config();

async function testGamification() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/codehub";
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");

    // Create a test user
    const testUser = await User.create({
      name: "Test Gamer",
      email: `testgamer${Date.now()}@example.com`,
      password: "Test@123456",
      isEmailVerified: true,
    });
    console.log("✅ Created test user:", testUser._id);

    // Initialize gamification
    const { gamification, streak } = await gamificationService.initializeGamification(
      testUser._id
    );
    console.log("✅ Initialized gamification");

    // Test adding points
    console.log("\n📊 Testing Points System:");
    await gamificationService.addPoints(
      testUser._id,
      50,
      "tutorial_completed",
      null
    );
    console.log("   ✅ Added 50 points for tutorial");

    await gamificationService.addPoints(
      testUser._id,
      15,
      "code_executed",
      null
    );
    console.log("   ✅ Added 15 points for code execution");

    await gamificationService.addPoints(testUser._id, 100, "course_completed", null);
    console.log("   ✅ Added 100 points for course completion");

    // Test streak update
    console.log("\n🔥 Testing Streak System:");
    await gamificationService.updateStreak(testUser._id);
    console.log("   ✅ Updated streak");

    // Get updated stats
    const stats = await gamificationService.getUserStats(testUser._id);
    console.log(`   📈 Total Points: ${stats?.totalPoints}`);
    console.log(`   📈 Level: ${stats?.level}`);
    console.log(`   📈 Current Streak: ${stats?.streak.currentStreak} days`);

    // Test badge unlock
    console.log("\n🏆 Testing Badges:");
    // First, create some badges for testing
    const badge = await Badge.findOne({ name: "First Steps" });
    if (badge) {
      const gamData = await UserGamification.findOne({ user: testUser._id });
      if (gamData) {
        gamData.statistics.tutorialsCompleted = 1;
        await gamData.save();
        await gamificationService.checkAndUnlockBadges(testUser._id, gamData);
        console.log("   ✅ Checked for badge unlocks");
      }
    }

    // Get updated stats with badges
    const updatedStats = await gamificationService.getUserStats(testUser._id);
    console.log(`   🎖️ Badges Earned: ${updatedStats?.badges.length || 0}`);

    // Test leaderboard
    console.log("\n🏅 Testing Leaderboard:");
    const leaderboard = await gamificationService.getLeaderboard(10);
    console.log(`   ✅ Retrieved leaderboard with ${leaderboard.length} users`);

    // Test user rank
    const rank = await gamificationService.getUserRank(testUser._id);
    console.log(`   ✅ User rank: #${rank}`);

    console.log("\n✨ All gamification tests passed!");

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    await UserGamification.deleteOne({ user: testUser._id });
    await Streak.deleteOne({ user: testUser._id });
    console.log("✅ Cleaned up test data");

    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testGamification();
