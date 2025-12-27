import express from "express";
import quizGeneratorController from "../controllers/quizGeneratorController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Generate AI quiz (requires authentication)
router.post(
  "/generate",
  auth,
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
