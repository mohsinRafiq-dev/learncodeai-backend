import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer", "coding"],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  description: String,
  order: Number,
  // For multiple-choice and true-false
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  // For short-answer
  acceptableAnswers: [String],
  caseSensitive: {
    type: Boolean,
    default: false,
  },
  // For coding problems
  codingProblem: {
    title: String,
    description: String,
    starterCode: String,
    language: String,
    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
  },
  points: {
    type: Number,
    default: 1,
    min: 1,
  },
  explanation: String,
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ["section-quiz", "final-quiz", "practice-quiz"],
      default: "section-quiz",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSection",
    },
    questions: [questionSchema],
    totalPoints: {
      type: Number,
      default: 0,
    },
    passingScore: {
      // percentage (0-100)
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    timeLimit: {
      // in minutes, 0 = no limit
      type: Number,
      default: 0,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    showAnswerExplanation: {
      type: Boolean,
      default: true,
    },
    retakeAllowed: {
      type: Boolean,
      default: true,
    },
    maxRetakes: {
      type: Number,
      default: 3,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Calculate total points before saving
quizSchema.pre("save", function (next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  next();
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;

