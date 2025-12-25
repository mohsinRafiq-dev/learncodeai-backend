import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseLesson",
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  timeSpentMinutes: {
    type: Number,
    default: 0,
  },
  lastAccessedAt: Date,
});

const sectionProgressSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseSection",
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  lessons: [lessonProgressSchema],
  sectionQuizScore: {
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number, // percentage
    maxScore: Number,
    attemptCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    passed: Boolean,
  },
  timeSpentMinutes: {
    type: Number,
    default: 0,
  },
});

const courseEnrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "dropped", "on-hold"],
      default: "active",
    },
    completionDate: Date,
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      default: null,
    },
    // Progress tracking
    sectionProgress: [sectionProgressSchema],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Final assessment
    finalQuizScore: {
      quizId: mongoose.Schema.Types.ObjectId,
      score: Number, // percentage
      maxScore: Number,
      attemptCount: {
        type: Number,
        default: 0,
      },
      lastAttemptAt: Date,
      passed: Boolean,
    },
    totalTimeSpentMinutes: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

// Compound index for unique enrollment per user per course
courseEnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
courseEnrollmentSchema.index({ user: 1, status: 1 });
courseEnrollmentSchema.index({ course: 1 });

const CourseEnrollment = mongoose.model(
  "CourseEnrollment",
  courseEnrollmentSchema
);
export default CourseEnrollment;

