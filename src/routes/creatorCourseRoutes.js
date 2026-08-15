// Creator course management, mounted at /api/creator/courses.
// Every route requires an approved creator; per-course routes also require
// ownership.

import express from "express";
import Course from "../models/Course.js";
import creatorCourseController from "../controllers/creatorCourseController.js";
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

router.patch("/:courseId", owned, creatorCourseController.updateCourse);
router.patch("/:courseId/pricing", owned, creatorCourseController.setPricing);
router.get("/:courseId/readiness", owned, creatorCourseController.getReadiness);
router.get("/:courseId/sales", owned, creatorCourseController.getCourseSales);
router.delete("/:courseId", owned, creatorCourseController.deleteCourse);

// submit | withdraw | publish | unpublish
router.post("/:courseId/:action", owned, creatorCourseController.runTransition);

export default router;
