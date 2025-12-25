import express from "express";
import auth from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  changeUserRole,
  deleteUser,
  getUserDetails,
  updateUserDetails,
  sendEmailToUser,
  getAllTutorials,
  updateTutorial,
  deleteTutorial,
  createTutorial,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAnalytics,
  searchUsers,
  getRecentActivity,
  getPendingCertificates,
  approveCertificate,
  rejectCertificate,
  getNewsletterSubscriptions,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(auth, adminMiddleware);

// Dashboard statistics
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/search", searchUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUserDetails);
router.put("/users/:userId/status", updateUserStatus);
router.put("/users/:userId/role", changeUserRole);
router.post("/users/:userId/send-email", sendEmailToUser);
router.delete("/users/:userId", deleteUser);

// Tutorial management
router.get("/tutorials", getAllTutorials);
router.post("/tutorials", createTutorial);
router.put("/tutorials/:tutorialId", updateTutorial);
router.delete("/tutorials/:tutorialId", deleteTutorial);

// Course management
router.get("/courses", getAllCourses);
router.post("/courses", createCourse);
router.put("/courses/:courseId", updateCourse);
router.delete("/courses/:courseId", deleteCourse);

// Analytics
router.get("/analytics", getAnalytics);

// Recent Activity
router.get("/recent-activity", getRecentActivity);

// Certificate Management
router.get("/certificates/pending", getPendingCertificates);
router.put("/certificates/:certificateId/approve", approveCertificate);
router.put("/certificates/:certificateId/reject", rejectCertificate);

// Newsletter Management
router.get("/newsletter-subscriptions", getNewsletterSubscriptions);

export default router;

