import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    language: {
      type: String,
      enum: ["python", "cpp", "javascript", "sql", "rust", "haskell"],
      required: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: [
        "programming-language",
        "data-structures",
        "algorithms",
        "web-development",
        "other",
      ],
      required: true,
      lowercase: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Course content - sections contain lessons and quizzes
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseSection",
      },
    ],
    // Final assessment
    finalQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    // Certificate
    certificateTemplate: {
      type: String,
      default: "standard",
      enum: ["standard", "distinguished", "excellence"],
    },
    // Metadata
    thumbnail: {
      type: String,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalSections: {
      type: Number,
      default: 0,
    },
    // Engagement metrics
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

// Indexes for better query performance
courseSchema.index({ language: 1, category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1, isArchived: 1 });
courseSchema.index({ category: 1, difficulty: 1 });

const Course = mongoose.model("Course", courseSchema);
export default Course;

