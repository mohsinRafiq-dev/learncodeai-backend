import gamificationService from "../services/gamificationService.js";
import UserGamification from "../models/UserGamification.js";
import Streak from "../models/Streak.js";

class GamificationController {
  // Get user gamification stats
  async getUserStats(req, res) {
    try {
      const userId = req.user._id;
      const stats = await gamificationService.getUserStats(userId);

      if (!stats) {
        // Initialize if not exists
        await gamificationService.initializeGamification(userId);
        const newStats = await gamificationService.getUserStats(userId);
        return res.status(200).json({
          success: true,
          data: newStats,
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching gamification stats",
        error: error.message,
      });
    }
  }

  // Add points (internal - called by other controllers)
  async addPoints(req, res) {
    try {
      const userId = req.user._id;
      const { points, reason, relatedId } = req.body;

      if (!points || !reason) {
        return res.status(400).json({
          success: false,
          message: "Points and reason are required",
        });
      }

      const gamification = await gamificationService.addPoints(
        userId,
        points,
        reason,
        relatedId
      );

      res.status(200).json({
        success: true,
        data: gamification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error adding points",
        error: error.message,
      });
    }
  }

  // Get leaderboard
  async getLeaderboard(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const leaderboard = await gamificationService.getLeaderboard(
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching leaderboard",
        error: error.message,
      });
    }
  }

  // Get user rank
  async getUserRank(req, res) {
    try {
      const userId = req.user._id;
      const rank = await gamificationService.getUserRank(userId);

      res.status(200).json({
        success: true,
        data: { rank },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching user rank",
        error: error.message,
      });
    }
  }

  // Get user streak
  async getStreak(req, res) {
    try {
      const userId = req.user._id;
      const streak = await Streak.findOne({ user: userId });

      if (!streak) {
        return res.status(404).json({
          success: false,
          message: "Streak not found",
        });
      }

      res.status(200).json({
        success: true,
        data: streak,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching streak",
        error: error.message,
      });
    }
  }

  // Update streak (called after activity)
  async updateStreak(req, res) {
    try {
      const userId = req.user._id;
      const streak = await gamificationService.updateStreak(userId);

      res.status(200).json({
        success: true,
        data: streak,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating streak",
        error: error.message,
      });
    }
  }

  // Get user badges
  async getBadges(req, res) {
    try {
      const userId = req.user._id;
      const gamification = await UserGamification.findOne({ user: userId })
        .populate("badges.badge")
        .populate("achievements");

      if (!gamification) {
        return res.status(404).json({
          success: false,
          message: "Gamification data not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          badges: gamification.badges,
          achievements: gamification.achievements,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching badges",
        error: error.message,
      });
    }
  }

  // Get top users
  async getTopUsers(req, res) {
    try {
      const { limit = 10 } = req.query;
      const topUsers = await UserGamification.find()
        .sort({ totalPoints: -1 })
        .limit(parseInt(limit))
        .populate("user", "name profilePicture email");

      res.status(200).json({
        success: true,
        data: topUsers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching top users",
        error: error.message,
      });
    }
  }

  // Get achievements progress
  async getAchievementsProgress(req, res) {
    try {
      const userId = req.user._id;
      const gamification = await UserGamification.findOne({ user: userId });

      if (!gamification) {
        return res.status(404).json({
          success: false,
          message: "Gamification data not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          totalPoints: gamification.totalPoints,
          level: gamification.level,
          experiencePoints: gamification.experiencePoints,
          statistics: gamification.statistics,
          pointsBreakdown: gamification.pointsBreakdown,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching achievements progress",
        error: error.message,
      });
    }
  }
}

export default new GamificationController();
