import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "First Steps",
        "Code Master",
        "Quick Learner",
        "Night Owl",
        "Consistent Coder",
        "Course Completer",
        "Tutorial Expert",
        "Quiz Champion",
        "Helper",
        "Legendary",
      ],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // emoji or icon name
    category: {
      type: String,
      enum: ["completion", "milestone", "achievement", "special"],
      required: true,
    },
    requirements: {
      minPoints: { type: Number, default: 0 },
      minCoursesCompleted: { type: Number, default: 0 },
      minTutorialsCompleted: { type: Number, default: 0 },
      minCodeExecutions: { type: Number, default: 0 },
      minStreakDays: { type: Number, default: 0 },
      minQuizzesCompleted: { type: Number, default: 0 },
    },
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary"],
      default: "common",
    },
    points: { type: Number, default: 0 }, // bonus points for earning this badge
  },
  { timestamps: true }
);

const Badge = mongoose.model("Badge", badgeSchema);
export default Badge;
