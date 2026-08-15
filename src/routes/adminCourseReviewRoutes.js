// Admin course review queue, mounted at /api/admin/course-review.

import express from "express";
import adminCourseReviewController from "../controllers/adminCourseReviewController.js";
import { auth } from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(auth, adminMiddleware);

router.get("/", adminCourseReviewController.getQueue);
router.get("/:courseId", adminCourseReviewController.getCourseForReview);
// Runs every code example through the sandbox so a reviewer does not have to.
router.post("/:courseId/verify-code", adminCourseReviewController.verifyCourseCode);
// approve | reject | suspend | reinstate
router.post("/:courseId/:action", adminCourseReviewController.decide);

export default router;
