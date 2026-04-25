import express from "express";
import gamificationController from "../controllers/gamificationController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user gamification stats
router.get("/stats", auth, gamificationController.getUserStats);

// Get user rank
router.get("/rank", auth, gamificationController.getUserRank);

// Get leaderboard
router.get("/leaderboard", gamificationController.getLeaderboard);

// Get user streak
router.get("/streak", auth, gamificationController.getStreak);

// Update streak
router.put("/streak/update", auth, gamificationController.updateStreak);

// Get user badges
router.get("/badges", auth, gamificationController.getBadges);

// Get top users
router.get("/top-users", gamificationController.getTopUsers);

// Get achievements progress
router.get("/achievements/progress", auth, gamificationController.getAchievementsProgress);

// Add points (internal)
router.post("/points/add", auth, gamificationController.addPoints);

export default router;
