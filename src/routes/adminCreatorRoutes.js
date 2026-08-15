// Admin review of creator applications.
// Mounted under /api/admin/creators; every route is admin-gated.

import express from "express";
import adminCreatorController from "../controllers/adminCreatorController.js";
import { auth } from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(auth, adminMiddleware);

router.get("/", adminCreatorController.listApplications);
router.get("/:id", adminCreatorController.getApplication);
router.patch("/:id/decision", adminCreatorController.decide);
router.patch("/:id/suspend", adminCreatorController.setSuspension);

export default router;
