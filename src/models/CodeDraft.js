import mongoose from "mongoose";

const codeDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ["python", "javascript", "cpp"],
      required: true,
      lowercase: true,
    },
    code: { type: String, default: "" },
    input: { type: String, default: "" },
  },
  { timestamps: true }
);

// One draft per user/language — autosave overwrites
codeDraftSchema.index({ user: 1, language: 1 }, { unique: true });

const CodeDraft = mongoose.model("CodeDraft", codeDraftSchema);
export default CodeDraft;
