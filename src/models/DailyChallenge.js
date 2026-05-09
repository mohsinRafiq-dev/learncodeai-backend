import mongoose from "mongoose";

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: {
      type: String,
      enum: ["python", "javascript", "cpp"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    starterCode: { type: String, default: "" },
    solution: { type: String, default: "" },
    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
    points: { type: Number, default: 50 },
    bonusPointsForStreak: { type: Number, default: 25 },
  },
  { timestamps: true }
);

const dailyChallengeAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyChallenge",
      required: true,
    },
    challengeDate: { type: String, required: true, index: true },
    code: { type: String, required: true },
    passed: { type: Boolean, default: false },
    pointsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyChallengeAttemptSchema.index(
  { user: 1, challengeDate: 1 },
  { unique: true }
);

export const DailyChallenge = mongoose.model("DailyChallenge", dailyChallengeSchema);
export const DailyChallengeAttempt = mongoose.model(
  "DailyChallengeAttempt",
  dailyChallengeAttemptSchema
);
