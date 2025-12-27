import express from "express";
import discussionController from "../controllers/discussionController.js";
import auth from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminMiddleware.js";

const router = express.Router();

// ============== ADMIN/MODERATION ROUTES (must be before :discussionId) ==============

// Get forum statistics
router.get(
  "/admin/stats",
  auth,
  adminAuth,
  discussionController.getForumStats.bind(discussionController)
);

// Get reported content
router.get(
  "/admin/reports",
  auth,
  adminAuth,
  discussionController.getReportedContent.bind(discussionController)
);

// ============== PUBLIC ROUTES ==============

// Get all discussions (with optional filters)
router.get("/", discussionController.getDiscussions.bind(discussionController));

// Get single discussion (optional auth for view tracking)
router.get(
  "/:discussionId",
  (req, res, next) => {
    // Optional auth - don't fail if not authenticated
    auth(req, res, (err) => {
      next();
    });
  },
  discussionController.getDiscussion.bind(discussionController)
);

// ============== AUTHENTICATED ROUTES ==============

// Create discussion
router.post(
  "/",
  auth,
  discussionController.createDiscussion.bind(discussionController)
);

// Edit discussion
router.put(
  "/:discussionId",
  auth,
  discussionController.editDiscussion.bind(discussionController)
);

// Delete discussion
router.delete(
  "/:discussionId",
  auth,
  discussionController.deleteDiscussion.bind(discussionController)
);

// Vote on discussion
router.post(
  "/:discussionId/vote",
  auth,
  discussionController.voteDiscussion.bind(discussionController)
);

// Add comment/answer
router.post(
  "/:discussionId/comments",
  auth,
  discussionController.addComment.bind(discussionController)
);

// Edit comment
router.put(
  "/:discussionId/comments/:commentId",
  auth,
  discussionController.editComment.bind(discussionController)
);

// Delete comment
router.delete(
  "/:discussionId/comments/:commentId",
  auth,
  discussionController.deleteComment.bind(discussionController)
);

// Vote on comment
router.post(
  "/:discussionId/comments/:commentId/vote",
  auth,
  discussionController.voteComment.bind(discussionController)
);

// Accept answer
router.post(
  "/:discussionId/comments/:commentId/accept",
  auth,
  discussionController.acceptAnswer.bind(discussionController)
);

// Report discussion
router.post(
  "/:discussionId/report",
  auth,
  discussionController.reportContent.bind(discussionController)
);

// Report comment
router.post(
  "/:discussionId/comments/:commentId/report",
  auth,
  discussionController.reportContent.bind(discussionController)
);

// ============== ADMIN MODERATION ACTIONS ==============

// Moderate discussion (hide/unhide)
router.post(
  "/:discussionId/moderate",
  auth,
  adminAuth,
  discussionController.moderateContent.bind(discussionController)
);

// Moderate comment (hide/unhide)
router.post(
  "/:discussionId/comments/:commentId/moderate",
  auth,
  adminAuth,
  discussionController.moderateContent.bind(discussionController)
);

// Lock/unlock discussion
router.post(
  "/:discussionId/lock",
  auth,
  adminAuth,
  discussionController.lockDiscussion.bind(discussionController)
);

// Pin/unpin discussion
router.post(
  "/:discussionId/pin",
  auth,
  adminAuth,
  discussionController.pinDiscussion.bind(discussionController)
);

// Dismiss report on discussion
router.delete(
  "/:discussionId/reports/:reportId",
  auth,
  adminAuth,
  discussionController.dismissReport.bind(discussionController)
);

// Dismiss report on comment
router.delete(
  "/:discussionId/comments/:commentId/reports/:reportId",
  auth,
  adminAuth,
  discussionController.dismissReport.bind(discussionController)
);

export default router;
