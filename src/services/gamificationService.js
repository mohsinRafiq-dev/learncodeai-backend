import UserGamification from "../models/UserGamification.js";
import Streak from "../models/Streak.js";
import Badge from "../models/Badge.js";
import Achievement from "../models/Achievement.js";
import User from "../models/User.js";

const XP_PER_LEVEL = 1000; // XP required per level
const POINTS_CONFIG = {
  courseCompletion: 100,
  tutorialCompletion: 50,
  codeExecution: 10,
  successfulExecution: 15,
  quizCompletion: 75,
  streakBonus: {
    3: 25, // 3-day streak: +25 points
    7: 75, // 7-day streak: +75 points
    14: 150, // 14-day streak: +150 points
    30: 300, // 30-day streak: +300 points
  },
};

class GamificationService {
  // Initialize gamification for new user
  async initializeGamification(userId) {
    try {
      // Check if already exists
      let gamification = await UserGamification.findOne({ user: userId });
      let streak = await Streak.findOne({ user: userId });

      if (!gamification) {
        gamification = await UserGamification.create({
          user: userId,
          totalPoints: 0,
          level: 1,
          experiencePoints: 0,
        });
      }

      if (!streak) {
        streak = await Streak.create({
          user: userId,
          currentStreak: 0,
          longestStreak: 0,
        });
      }

      // Update user references
      await User.findByIdAndUpdate(
        userId,
        {
          gamification: gamification._id,
          streak: streak._id,
        },
        { new: true }
      );

      return { gamification, streak };
    } catch (error) {
      console.error("Error initializing gamification:", error);
      throw error;
    }
  }

  // Add points to user
  async addPoints(userId, points, reason, relatedId = null) {
    try {
      let gamification = await UserGamification.findOne({ user: userId });

      if (!gamification) {
        const { gamification: newGamification } = await this.initializeGamification(userId);
        gamification = newGamification;
      }

      const previousLevel = gamification.level;
      const previousPoints = gamification.totalPoints;

      // Add to total points
      gamification.totalPoints += points;

      // Update breakdown
      if (reason === "course_completed") {
        gamification.pointsBreakdown.courseCompletion += points;
        gamification.statistics.coursesCompleted += 1;
      } else if (reason === "tutorial_completed") {
        gamification.pointsBreakdown.tutorialCompletion += points;
        gamification.statistics.tutorialsCompleted += 1;
      } else if (reason === "code_executed") {
        gamification.pointsBreakdown.codeExecution += points;
        gamification.statistics.codeExecutions += 1;
      } else if (reason === "quiz_completed") {
        gamification.pointsBreakdown.quizCompletion += points;
        gamification.statistics.quizzesCompleted += 1;
      } else if (reason === "streak_bonus") {
        gamification.pointsBreakdown.streakBonus += points;
      }

      // Calculate new level based on total points
      const newLevel = Math.floor(gamification.totalPoints / XP_PER_LEVEL) + 1;
      gamification.level = newLevel;
      gamification.experiencePoints = gamification.totalPoints % XP_PER_LEVEL;

      // Add to history
      gamification.pointsHistory.push({
        date: new Date(),
        points,
        reason,
        relatedId,
      });

      gamification.lastPointsUpdate = new Date();
      await gamification.save();

      // Check for level up
      if (newLevel > previousLevel) {
        await this.checkAndUnlockBadges(userId, gamification);
      }

      return gamification;
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  }

  // Update streak
  async updateStreak(userId) {
    try {
      let streak = await Streak.findOne({ user: userId });

      if (!streak) {
        const { streak: newStreak } = await this.initializeGamification(userId);
        streak = newStreak;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
      }

      // Check if activity is today
      const todayTime = today.getTime();
      const lastActivityTime = lastActivity ? lastActivity.getTime() : null;

      if (lastActivityTime === todayTime) {
        // Already active today, don't update
        return streak;
      }

      // Check if it's consecutive
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActivityTime === yesterday.getTime()) {
        // Consecutive day, increase streak
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else if (lastActivityTime !== null) {
        // Streak broken
        if (streak.currentStreak > 0) {
          streak.totalStreakDays += streak.currentStreak;
        }
        streak.currentStreak = 1;
      } else {
        // First activity
        streak.currentStreak = 1;
      }

      streak.lastActivityDate = new Date();
      streak.streakStartDate = streak.streakStartDate || new Date();

      await streak.save();

      // Check for streak bonuses
      const streakBonuses = Object.keys(POINTS_CONFIG.streakBonus);
      for (const streakDay of streakBonuses) {
        if (streak.currentStreak === parseInt(streakDay)) {
          const bonus = POINTS_CONFIG.streakBonus[streakDay];
          await this.addPoints(userId, bonus, "streak_bonus", null);
        }
      }

      return streak;
    } catch (error) {
      console.error("Error updating streak:", error);
      throw error;
    }
  }

  // Check and unlock badges
  async checkAndUnlockBadges(userId, gamification = null) {
    try {
      if (!gamification) {
        gamification = await UserGamification.findOne({ user: userId }).populate("badges");
      }

      const allBadges = await Badge.find();
      const userAchievements = await Achievement.find({ user: userId });
      const unlockedBadgeIds = userAchievements.map((a) => a.badge.toString());

      for (const badge of allBadges) {
        // Skip if already unlocked
        if (unlockedBadgeIds.includes(badge._id.toString())) {
          continue;
        }

        const requirements = badge.requirements;
        const stats = gamification.statistics;

        // Check if requirements are met
        const meetsRequirements =
          gamification.totalPoints >= requirements.minPoints &&
          stats.coursesCompleted >= requirements.minCoursesCompleted &&
          stats.tutorialsCompleted >= requirements.minTutorialsCompleted &&
          stats.codeExecutions >= requirements.minCodeExecutions &&
          stats.quizzesCompleted >= requirements.minQuizzesCompleted;

        if (meetsRequirements) {
          // Unlock badge
          const achievement = await Achievement.create({
            user: userId,
            badge: badge._id,
            unlockedAt: new Date(),
            isUnlocked: true,
          });

          gamification.achievements.push(achievement._id);
          gamification.badges.push({
            badge: badge._id,
            unlockedAt: new Date(),
          });

          // Add bonus points
          if (badge.points > 0) {
            gamification.totalPoints += badge.points;
            gamification.pointsHistory.push({
              date: new Date(),
              points: badge.points,
              reason: "badge_earned",
              relatedId: badge._id,
            });
          }
        }
      }

      await gamification.save();
      return gamification;
    } catch (error) {
      console.error("Error checking badges:", error);
      throw error;
    }
  }

  // Get user gamification stats
  async getUserStats(userId) {
    try {
      const gamification = await UserGamification.findOne({ user: userId })
        .populate("badges.badge")
        .populate("achievements");

      const streak = await Streak.findOne({ user: userId });

      if (!gamification) {
        return null;
      }

      return {
        totalPoints: gamification.totalPoints,
        level: gamification.level,
        experiencePoints: gamification.experiencePoints,
        xpToNextLevel: XP_PER_LEVEL - gamification.experiencePoints,
        badges: gamification.badges,
        achievements: gamification.achievements,
        statistics: gamification.statistics,
        leaderboardRank: gamification.leaderboardRank,
        streak: {
          currentStreak: streak?.currentStreak || 0,
          longestStreak: streak?.longestStreak || 0,
          lastActivityDate: streak?.lastActivityDate,
        },
        pointsBreakdown: gamification.pointsBreakdown,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard(limit = 100, offset = 0) {
    try {
      const leaderboard = await UserGamification.find()
        .sort({ totalPoints: -1 })
        .limit(limit)
        .skip(offset)
        .populate("user", "name profilePicture");

      // Update ranks
      for (let i = 0; i < leaderboard.length; i++) {
        leaderboard[i].leaderboardRank = offset + i + 1;
        await leaderboard[i].save();
      }

      return leaderboard;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  // Get user rank
  async getUserRank(userId) {
    try {
      const userGamification = await UserGamification.findOne({ user: userId });

      if (!userGamification) {
        return null;
      }

      const rank = await UserGamification.countDocuments({
        totalPoints: { $gt: userGamification.totalPoints },
      });

      return rank + 1;
    } catch (error) {
      console.error("Error getting user rank:", error);
      throw error;
    }
  }

  // Initialize badges (create default badges)
  async initializeBadges() {
    try {
      const badges = [
        {
          name: "First Steps",
          title: "First Steps",
          description: "Complete your first tutorial",
          icon: "👣",
          category: "completion",
          requirements: { minTutorialsCompleted: 1 },
          rarity: "common",
          points: 25,
        },
        {
          name: "Code Master",
          title: "Code Master",
          description: "Execute 100 code snippets successfully",
          icon: "🧑‍💻",
          category: "milestone",
          requirements: { minCodeExecutions: 100 },
          rarity: "rare",
          points: 100,
        },
        {
          name: "Quick Learner",
          title: "Quick Learner",
          description: "Complete 5 tutorials in one week",
          icon: "⚡",
          category: "achievement",
          requirements: { minTutorialsCompleted: 5 },
          rarity: "uncommon",
          points: 50,
        },
        {
          name: "Night Owl",
          title: "Night Owl",
          description: "Maintain a 7-day learning streak",
          icon: "🦉",
          category: "achievement",
          requirements: { minStreakDays: 7 },
          rarity: "uncommon",
          points: 75,
        },
        {
          name: "Consistent Coder",
          title: "Consistent Coder",
          description: "Maintain a 14-day learning streak",
          icon: "🔥",
          category: "achievement",
          requirements: { minStreakDays: 14 },
          rarity: "rare",
          points: 150,
        },
        {
          name: "Course Completer",
          title: "Course Completer",
          description: "Complete 3 courses",
          icon: "🎓",
          category: "completion",
          requirements: { minCoursesCompleted: 3 },
          rarity: "rare",
          points: 100,
        },
        {
          name: "Tutorial Expert",
          title: "Tutorial Expert",
          description: "Complete 25 tutorials",
          icon: "📚",
          category: "milestone",
          requirements: { minTutorialsCompleted: 25 },
          rarity: "epic",
          points: 200,
        },
        {
          name: "Quiz Champion",
          title: "Quiz Champion",
          description: "Complete 10 quizzes",
          icon: "🏆",
          category: "achievement",
          requirements: { minQuizzesCompleted: 10 },
          rarity: "epic",
          points: 150,
        },
        {
          name: "Helper",
          title: "Helper",
          description: "Earn 1000 points",
          icon: "🤝",
          category: "milestone",
          requirements: { minPoints: 1000 },
          rarity: "epic",
          points: 250,
        },
        {
          name: "Legendary",
          title: "Legendary",
          description: "Reach level 50",
          icon: "👑",
          category: "special",
          requirements: { minPoints: 50000 },
          rarity: "legendary",
          points: 500,
        },
      ];

      for (const badgeData of badges) {
        const exists = await Badge.findOne({ name: badgeData.name });
        if (!exists) {
          await Badge.create(badgeData);
        }
      }

      console.log("✅ Default badges initialized");
    } catch (error) {
      console.error("Error initializing badges:", error);
    }
  }
}

export default new GamificationService();
