// Creator Studio routes.
//
// Applying is open to any signed-in user; everything else requires an approved
// creator profile.

import express from "express";
import creatorController from "../controllers/creatorController.js";
import { auth } from "../middleware/authMiddleware.js";
import { requireCreator } from "../middleware/creatorMiddleware.js";

const router = express.Router();

// Open to any authenticated user
router.post("/apply", auth, creatorController.apply);
router.get("/me", auth, creatorController.getMyProfile);

// Approved creators only
router.get("/dashboard", auth, requireCreator, creatorController.getDashboard);
router.get("/earnings", auth, requireCreator, creatorController.getEarnings);

export default router;
