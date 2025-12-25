import mongoose from "mongoose";

const codeExampleSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  language: String,
  input: String,
  expectedOutput: String,
  order: Number,
});

const resourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: String, // e.g., "documentation", "article", "video"
}, { _id: false });

const courseLessonSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSection",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Lesson content is required"],
    },
    order: {
      type: Number,
      required: true,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    duration: {
      // in minutes
      type: Number,
      default: 0,
    },
    codeExamples: [codeExampleSchema],
    practiceProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CodeSnippet",
      },
    ],
    notes: [String],
    tips: [String],
    resources: [resourceSchema],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
courseLessonSchema.index({ section: 1, order: 1 });

const CourseLesson = mongoose.model("CourseLesson", courseLessonSchema);
export default CourseLesson;

