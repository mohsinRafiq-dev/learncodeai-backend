import express from "express";
import quizGeneratorController from "../controllers/quizGeneratorController.js";
import auth from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { chargeAiCredits } from "../middleware/aiCreditMiddleware.js";

const router = express.Router();

// Generate AI quiz (requires authentication).
// Costs more than a chat message: one generation produces a whole quiz.
router.post(
  "/generate",
  auth,
  aiLimiter,
  chargeAiCredits("quiz_generation"),
  quizGeneratorController.generateQuiz.bind(quizGeneratorController)
);

// Get all practice quizzes (public)
router.get(
  "/",
  quizGeneratorController.getPracticeQuizzes.bind(quizGeneratorController)
);

// Get specific practice quiz
router.get(
  "/:quizId",
  auth,
  quizGeneratorController.getPracticeQuiz.bind(quizGeneratorController)
);

// Submit practice quiz answers
router.post(
  "/:quizId/submit",
  auth,
  quizGeneratorController.submitPracticeQuiz.bind(quizGeneratorController)
);

export default router;
