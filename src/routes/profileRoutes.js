import express from "express";
import * as profileController from "../controllers/profileController.js";
import auth from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ========== PROFILE MANAGEMENT ==========
router.get("/", auth, profileController.getProfile);
router.put("/", auth, profileController.updateProfile);
router.post("/prompt-shown", auth, profileController.markPromptShown);
router.post("/upload-picture", auth, upload.single("profilePicture"), profileController.uploadProfilePicture);

// ========== PROGRESS TRACKING ==========
router.get("/progress/courses", auth, profileController.getCourseProgress);
router.get("/dashboard", auth, profileController.getDashboardStats);

// ========== ENROLLMENT MANAGEMENT ==========
router.get("/enrollments", auth, profileController.getUserEnrollments);
router.put("/enrollments/:enrollmentId/status", auth, profileController.updateEnrollmentStatus);

// ========== CERTIFICATES ==========
router.get("/certificates", auth, profileController.getUserCertificates);
router.get("/certificates/:certificateId/download", auth, profileController.downloadCertificatePdf);

export default router;
