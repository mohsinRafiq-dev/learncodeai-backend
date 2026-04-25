import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },
    unlockedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 100 }, // 0-100 for unlocked achievements
    isUnlocked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure one achievement per user-badge combination
achievementSchema.index({ user: 1, badge: 1 }, { unique: true });

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement;
