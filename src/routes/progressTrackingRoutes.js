import express from "express";
import progressTrackingController from "../controllers/progressTrackingController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get comprehensive progress dashboard
router.get("/dashboard", auth, progressTrackingController.getDashboard);

// Get performance analytics (strengths/weaknesses)
router.get("/analytics", auth, progressTrackingController.getPerformanceAnalytics);

// Export progress report (JSON or CSV)
router.get("/export", auth, progressTrackingController.exportProgressReport);

export default router;
