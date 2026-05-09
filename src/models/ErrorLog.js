import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    language: {
      type: String,
      enum: ["python", "javascript", "cpp"],
      required: true,
      lowercase: true,
    },
    errorType: {
      type: String,
      enum: ["syntax", "runtime", "timeout", "compilation", "other"],
      default: "other",
    },
    errorMessage: { type: String, default: "" },
    snippet: { type: String, default: "" },
    occurredAt: { type: Date, default: Date.now },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseLesson", default: null },
    tutorialId: { type: mongoose.Schema.Types.ObjectId, ref: "Tutorial", default: null },
  },
  { timestamps: true }
);

errorLogSchema.index({ language: 1, errorType: 1 });
errorLogSchema.index({ occurredAt: -1 });

const ErrorLog = mongoose.model("ErrorLog", errorLogSchema);
export default ErrorLog;
