import mongoose from "mongoose";

const userGamificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 }, // 1-100 levels
    experiencePoints: { type: Number, default: 0 }, // XP towards next level
    badges: [
      {
        badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    ],
    leaderboardRank: { type: Number, default: null },
    pointsBreakdown: {
      courseCompletion: { type: Number, default: 0 }, // 100 points per course
      tutorialCompletion: { type: Number, default: 0 }, // 50 points per tutorial
      codeExecution: { type: Number, default: 0 }, // 10 points per successful execution
      quizCompletion: { type: Number, default: 0 }, // 75 points per quiz
      streakBonus: { type: Number, default: 0 }, // Bonus for maintaining streaks
    },
    statistics: {
      coursesCompleted: { type: Number, default: 0 },
      tutorialsCompleted: { type: Number, default: 0 },
      codeExecutions: { type: Number, default: 0 },
      quizzesCompleted: { type: Number, default: 0 },
      successfulExecutions: { type: Number, default: 0 },
      totalTimeSpentMinutes: { type: Number, default: 0 },
    },
    lastPointsUpdate: { type: Date, default: Date.now },
    pointsHistory: [
      {
        date: { type: Date, default: Date.now },
        points: { type: Number, required: true },
        reason: {
          type: String,
          enum: [
            "course_completed",
            "tutorial_completed",
            "code_executed",
            "quiz_completed",
            "badge_earned",
            "streak_bonus",
            "manual_adjustment",
          ],
        },
        relatedId: mongoose.Schema.Types.ObjectId, // Reference to course/tutorial/etc
      },
    ],
  },
  { timestamps: true }
);

const UserGamification = mongoose.model("UserGamification", userGamificationSchema);
export default UserGamification;
