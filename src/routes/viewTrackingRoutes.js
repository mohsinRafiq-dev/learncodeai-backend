import express from "express";
import {
  incrementTutorialView,
  incrementCourseView,
  getMostViewedTutorials,
  getMostViewedCourses,
  getMostViewedContent,
} from "../controllers/viewTrackingController.js";

const router = express.Router();

// Track views
router.post("/tutorials/:tutorialId/view", incrementTutorialView);
router.post("/courses/:courseId/view", incrementCourseView);

// Get most viewed content
router.get("/tutorials/most-viewed", getMostViewedTutorials);
router.get("/courses/most-viewed", getMostViewedCourses);
router.get("/most-viewed", getMostViewedContent);

export default router;

