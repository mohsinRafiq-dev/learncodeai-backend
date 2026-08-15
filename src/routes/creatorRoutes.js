// Creator Studio routes.
//
// Applying is open to any signed-in user; everything else requires an approved
// creator profile.

import express from "express";
import creatorController from "../controllers/creatorController.js";
import creatorPayoutController from "../controllers/creatorPayoutController.js";
import { auth } from "../middleware/authMiddleware.js";
import { requireCreator } from "../middleware/creatorMiddleware.js";

const router = express.Router();

// Open to any authenticated user
router.post("/apply", auth, creatorController.apply);
router.get("/me", auth, creatorController.getMyProfile);

// Approved creators only
router.get("/dashboard", auth, requireCreator, creatorController.getDashboard);
router.get("/earnings", auth, requireCreator, creatorController.getEarnings);

// Payouts — Stripe Connect onboarding and withdrawals
router.post("/payouts/onboard", auth, requireCreator, creatorPayoutController.startOnboarding);
router.get("/payouts/status", auth, requireCreator, creatorPayoutController.getStatus);
router.get("/payouts/dashboard-link", auth, requireCreator, creatorPayoutController.getDashboardLink);
router.post("/payouts/request", auth, requireCreator, creatorPayoutController.requestPayout);
router.get("/payouts", auth, requireCreator, creatorPayoutController.listMyPayouts);

export default router;
