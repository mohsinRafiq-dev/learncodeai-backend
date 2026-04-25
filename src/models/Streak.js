import mongoose from "mongoose";

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentStreak: { type: Number, default: 0 }, // Current consecutive days
    longestStreak: { type: Number, default: 0 }, // Longest streak ever
    lastActivityDate: { type: Date, default: null }, // Last day user was active
    streakStartDate: { type: Date, default: null }, // When current streak started
    totalStreakDays: { type: Number, default: 0 }, // Total days in all streaks combined
    activityLog: [
      {
        date: { type: Date, default: Date.now },
        activityType: {
          type: String,
          enum: ["code_execution", "tutorial_completed", "course_completed", "quiz_completed"],
        },
        points: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const Streak = mongoose.model("Streak", streakSchema);
export default Streak;
