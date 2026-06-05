import express from "express";
import courseController from "../controllers/courseController.js";
import quizCertificateController from "../controllers/quizCertificateController.js";
import auth from "../middleware/authMiddleware.js";
import { requireProOrLifetime } from "../middleware/tierMiddleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get("/", courseController.getAllCourses);
router.get("/language/:language", courseController.getCoursesByLanguage);
// Use auth middleware optionally - will attach user if token exists, but won't fail without it
router.get("/:id", (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    return auth(req, res, next);
  }
  next();
}, courseController.getCourseById);

// ========== PROTECTED ROUTES - ENROLLMENT ==========
router.post("/enroll", auth, courseController.enrollInCourse);
router.get("/user/enrolled", auth, courseController.getUserEnrolledCourses);
router.get("/:courseId/enrollment", auth, courseController.getEnrollmentDetails);

// ========== PROGRESS TRACKING ==========
router.put(
  "/:courseId/progress/lesson",
  auth,
  courseController.completeLessonProgress
);

// ========== QUIZ ROUTES (Pro / Lifetime only) ==========
// Quizzes are part of the paid experience — required for certificates.
router.get(
  "/quizzes/:quizId",
  auth,
  requireProOrLifetime,
  quizCertificateController.getQuizDetails
);
router.post(
  "/quizzes/:quizId/submit",
  auth,
  requireProOrLifetime,
  quizCertificateController.submitQuizAnswers
);
// Leaderboard remains visible to logged-in users (social proof).
router.get(
  "/quizzes/:quizId/leaderboard",
  auth,
  quizCertificateController.getQuizLeaderboard
);

export default router;

