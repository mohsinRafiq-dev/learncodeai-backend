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
        console.log(`🎉 Level up! User ${userId} reached level ${newLevel}`);
      }
      
      // Always check for badge unlocking after points are added
      await this.checkAndUnlockBadges(userId, gamification);

      return gamification;
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  }

  // Update streak - FIXED & DYNAMIC
  async updateStreak(userId) {
    try {
      let streak = await Streak.findOne({ user: userId });

      if (!streak) {
        const { streak: newStreak } = await this.initializeGamification(userId);
        streak = newStreak;
      }

      // Get today's date at midnight UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // Get last activity date at midnight UTC
      let lastActivityTime = null;
      if (streak.lastActivityDate) {
        const lastDate = new Date(streak.lastActivityDate);
        lastDate.setUTCHours(0, 0, 0, 0);
        lastActivityTime = lastDate.getTime();
      }

      // If already active today, return existing streak
      if (lastActivityTime === todayTime) {
        console.log(`ℹ️  User ${userId} already active today. Streak: ${streak.currentStreak}`);
        return streak;
      }

      // Calculate yesterday's date at midnight UTC
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayTime = yesterday.getTime();

      // Determine streak status
      if (lastActivityTime === null) {
        // First activity ever
        streak.currentStreak = 1;
        console.log(`✨ Starting new streak for user ${userId}`);
      } else if (lastActivityTime === yesterdayTime) {
        // Consecutive day - increase streak
        streak.currentStreak += 1;
        console.log(`🔥 Streak increased! User ${userId}: ${streak.currentStreak} days`);
      } else {
        // Fallback: Check absolute time difference to prevent timezone boundary bugs
        const now = new Date();
        const absoluteHoursDiff = (now.getTime() - new Date(streak.lastActivityDate).getTime()) / (1000 * 60 * 60);
        
        if (absoluteHoursDiff <= 36) {
           // It has been less than 36 hours, so it's realistically the "next day" for the user regardless of UTC boundaries.
           streak.currentStreak += 1;
           console.log(`🔥 Streak increased (Timezone Fallback)! User ${userId}: ${streak.currentStreak} days`);
        } else {
           // Streak legitimately broken
           if (streak.currentStreak > 0) {
             streak.totalStreakDays += streak.currentStreak;
             console.log(`💔 Streak broken. Saved ${streak.currentStreak} days. Total: ${streak.totalStreakDays}`);
           }
           streak.currentStreak = 1;
           console.log(`🆕 New streak started for user ${userId}`);
        }
      }

      // Update longest streak
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
        console.log(`🏆 New longest streak! ${streak.longestStreak} days`);
      }

      // Set activity dates using UTC day boundary to avoid timezone drift
      streak.lastActivityDate = new Date(todayTime);
      if (!streak.streakStartDate) {
        streak.streakStartDate = new Date(todayTime);
      }

      // Save streak (activity logging handled by points system)
      await streak.save();

      // Award streak bonuses if milestone reached
      const streakBonuses = Object.keys(POINTS_CONFIG.streakBonus);
      for (const streakDay of streakBonuses) {
        if (streak.currentStreak === parseInt(streakDay)) {
          const bonus = POINTS_CONFIG.streakBonus[streakDay];
          console.log(`🎁 Streak bonus awarded! ${streak.currentStreak} days = ${bonus} points`);
          await this.addPoints(userId, bonus, "streak_bonus", null);
        }
      }

      console.log(`✅ Streak updated for user ${userId}: Current=${streak.currentStreak}, Best=${streak.longestStreak}`);
      return streak;
    } catch (error) {
      console.error("❌ Error updating streak:", error);
      throw error;
    }
  }

  // Check and unlock badges
  async checkAndUnlockBadges(userId, gamification = null) {
    try {
      if (!gamification) {
        gamification = await UserGamification.findOne({ user: userId }).populate("badges");
      }

      // Get user's streak for streak-based badges
      const streak = await Streak.findOne({ user: userId });
      const currentStreak = streak?.currentStreak || 0;

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

        // Default requirement values (0 = no requirement)
        const minPoints = requirements.minPoints || 0;
        const minCoursesCompleted = requirements.minCoursesCompleted || 0;
        const minTutorialsCompleted = requirements.minTutorialsCompleted || 0;
        const minCodeExecutions = requirements.minCodeExecutions || 0;
        const minQuizzesCompleted = requirements.minQuizzesCompleted || 0;
        const minStreakDays = requirements.minStreakDays || 0;

        // Check if requirements are met
        const meetsRequirements =
          gamification.totalPoints >= minPoints &&
          stats.coursesCompleted >= minCoursesCompleted &&
          stats.tutorialsCompleted >= minTutorialsCompleted &&
          stats.codeExecutions >= minCodeExecutions &&
          stats.quizzesCompleted >= minQuizzesCompleted &&
          currentStreak >= minStreakDays;

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
            console.log(`🎖️  Badge "${badge.name}" unlocked for user ${userId}! +${badge.points} bonus points`);
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
