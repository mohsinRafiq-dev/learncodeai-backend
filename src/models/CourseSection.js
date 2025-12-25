import mongoose from "mongoose";

const courseSectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseLesson",
      },
    ],
    sectionQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    unlockCondition: {
      // e.g., "previous_section_completed", "score_required"
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
courseSectionSchema.index({ course: 1, order: 1 });

const CourseSection = mongoose.model("CourseSection", courseSectionSchema);
export default CourseSection;

