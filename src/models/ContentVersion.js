import mongoose from "mongoose";

const contentVersionSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ["tutorial", "course", "lesson"],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    versionNumber: { type: Number, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changeNote: { type: String, default: "" },
  },
  { timestamps: true }
);

contentVersionSchema.index({ contentType: 1, contentId: 1, versionNumber: -1 });

contentVersionSchema.statics.recordVersion = async function ({
  contentType,
  contentId,
  snapshot,
  changedBy = null,
  changeNote = "",
}) {
  const last = await this.findOne({ contentType, contentId })
    .sort({ versionNumber: -1 })
    .lean();
  const versionNumber = (last?.versionNumber || 0) + 1;
  return this.create({
    contentType,
    contentId,
    versionNumber,
    snapshot,
    changedBy,
    changeNote,
  });
};

const ContentVersion = mongoose.model("ContentVersion", contentVersionSchema);
export default ContentVersion;
