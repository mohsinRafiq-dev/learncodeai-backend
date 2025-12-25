import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tutorial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutorial",
      required: true,
    },
    completionPercent: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
    timeSpentMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;

