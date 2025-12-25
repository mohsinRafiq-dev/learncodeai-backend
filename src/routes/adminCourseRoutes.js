import express from "express";
import courseAdminController from "../controllers/courseAdminController.js";
import quizCertificateController from "../controllers/quizCertificateController.js";
import auth from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// ========== PROTECTED ADMIN ROUTES ==========

// Course Management
router.post("/", auth, adminMiddleware, courseAdminController.createCourse);
router.get(
  "/instructor/my-courses",
  auth,
  courseAdminController.getInstructorCourses
);
router.put("/:id", auth, adminMiddleware, courseAdminController.updateCourse);
router.patch(
  "/:id/publish",
  auth,
  adminMiddleware,
  courseAdminController.togglePublishCourse
);
router.delete(
  "/:id",
  auth,
  adminMiddleware,
  courseAdminController.deleteCourse
);

// Section Management
router.post(
  "/:courseId/sections",
  auth,
  adminMiddleware,
  courseAdminController.addSection
);
router.put(
  "/sections/:sectionId",
  auth,
  adminMiddleware,
  courseAdminController.updateSection
);
router.delete(
  "/sections/:sectionId",
  auth,
  adminMiddleware,
  courseAdminController.deleteSection
);

// Lesson Management
router.post(
  "/sections/:sectionId/lessons",
  auth,
  adminMiddleware,
  courseAdminController.addLesson
);
router.get(
  "/sections/:sectionId/lessons",
  auth,
  adminMiddleware,
  courseAdminController.getSectionLessons
);
router.put(
  "/lessons/:lessonId",
  auth,
  adminMiddleware,
  courseAdminController.updateLesson
);
router.delete(
  "/lessons/:lessonId",
  auth,
  adminMiddleware,
  courseAdminController.deleteLesson
);

// Quiz Management
router.post(
  "/:courseId/quizzes",
  auth,
  adminMiddleware,
  courseAdminController.createOrUpdateQuiz
);
router.put(
  "/quizzes/:quizId",
  auth,
  adminMiddleware,
  courseAdminController.createOrUpdateQuiz
);
router.get(
  "/quizzes/:quizId",
  auth,
  adminMiddleware,
  courseAdminController.getQuiz
);
router.delete(
  "/quizzes/:quizId",
  auth,
  adminMiddleware,
  courseAdminController.deleteQuiz
);

// Get course sections (for admin management)
router.get(
  "/:courseId/sections",
  auth,
  adminMiddleware,
  courseAdminController.getCourseSections
);

// ========== CERTIFICATE ROUTES ==========
// Protected - user's own certificates
router.get(
  "/user/certificates",
  auth,
  quizCertificateController.getUserCertificates
);
router.get(
  "/certificates/:certificateId",
  auth,
  quizCertificateController.getCertificateById
);

// Public - verify certificate
router.get(
  "/verify/certificate",
  quizCertificateController.verifyCertificate
);

export default router;

