import mongoose from "mongoose";

const codingAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  code: { type: String, required: true },
  passed: { type: Boolean, default: false },
  similarityScore: { type: Number, default: 0 },
  similarityFlagged: { type: Boolean, default: false },
  matchedSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizSubmission",
    default: null,
  },
});

const quizSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 },
    codingAnswers: [codingAnswerSchema],
  },
  { timestamps: true }
);

quizSubmissionSchema.index({ quiz: 1, user: 1, createdAt: -1 });
quizSubmissionSchema.index({ "codingAnswers.questionId": 1 });

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);
export default QuizSubmission;
