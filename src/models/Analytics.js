import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    activeUsers: { type: Number, default: 0 },
    newSignups: { type: Number, default: 0 },
    totalTutorials: { type: Number, default: 0 },
    feedbackCount: { type: Number, default: 0 },
    mostViewedTutorials: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Tutorial" },
    ],
  },
  { timestamps: true }
);

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;

