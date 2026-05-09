import mongoose from "mongoose";

const aiFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feature: {
      type: String,
      enum: [
        "error-explanation",
        "problem-hint",
        "code-optimization",
        "ask-question",
        "chat",
      ],
      required: true,
    },
    helpful: { type: Boolean, required: true },
    promptHash: { type: String, default: "" },
    note: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

aiFeedbackSchema.index({ feature: 1, helpful: 1, createdAt: -1 });
aiFeedbackSchema.index({ user: 1, createdAt: -1 });

const AIFeedback = mongoose.model("AIFeedback", aiFeedbackSchema);
export default AIFeedback;
