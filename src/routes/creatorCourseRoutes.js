// Creator course management, mounted at /api/creator/courses.
// Every route requires an approved creator; per-course routes also require
// ownership.

import express from "express";
import Course from "../models/Course.js";
import creatorCourseController from "../controllers/creatorCourseController.js";
import courseAdminController from "../controllers/courseAdminController.js";
import { auth } from "../middleware/authMiddleware.js";
import {
  requireCreator,
  requireCourseOwnership,
} from "../middleware/creatorMiddleware.js";

const router = express.Router();

router.use(auth, requireCreator);

const owned = requireCourseOwnership((req) => Course.findById(req.params.courseId));

router.get("/", creatorCourseController.listMyCourses);
router.post("/", creatorCourseController.createCourse);

// ---- Course-scoped content authoring ----
//
// These reuse the section/lesson/quiz handlers from courseAdminController.
// Those handlers already perform their own ownership check
// (`instructor !== req.user._id && role !== 'admin'` -> 403); the only thing
// that kept creators out was route-level adminMiddleware. Exposing them here
// without it is therefore safe, and duplicating the logic would be worse — two
// copies of an authorisation check drift.
//
// Without these a creator could create a course shell and nothing else, while
// validateForSubmission demands at least one section and three lessons. The
// creator flow was unfinishable.
router.get("/:courseId/sections", owned, courseAdminController.getCourseSections);
router.post("/:courseId/sections", owned, courseAdminController.addSection);
router.put("/sections/:sectionId", courseAdminController.updateSection);
router.delete("/sections/:sectionId", courseAdminController.deleteSection);

router.get("/sections/:sectionId/lessons", courseAdminController.getSectionLessons);
router.post("/sections/:sectionId/lessons", courseAdminController.addLesson);
router.put("/lessons/:lessonId", courseAdminController.updateLesson);
router.delete("/lessons/:lessonId", courseAdminController.deleteLesson);

router.post("/:courseId/quizzes", owned, courseAdminController.createOrUpdateQuiz);
router.put("/quizzes/:quizId", courseAdminController.createOrUpdateQuiz);
router.get("/quizzes/:quizId", courseAdminController.getQuiz);
router.delete("/quizzes/:quizId", courseAdminController.deleteQuiz);

// ---- Course-level settings and lifecycle ----
router.patch("/:courseId", owned, creatorCourseController.updateCourse);
router.patch("/:courseId/pricing", owned, creatorCourseController.setPricing);
router.get("/:courseId/readiness", owned, creatorCourseController.getReadiness);
router.get("/:courseId/sales", owned, creatorCourseController.getCourseSales);
router.delete("/:courseId", owned, creatorCourseController.deleteCourse);

// submit | withdraw | publish | unpublish.
// Declared last: "/:courseId/:action" would otherwise swallow the more specific
// paths above, so that "/:courseId/sections" resolved to action="sections".
router.post("/:courseId/:action", owned, creatorCourseController.runTransition);

export default router;
