// Admin payout approval, mounted at /api/admin/payouts.

import express from "express";
import adminPayoutController from "../controllers/adminPayoutController.js";
import { auth } from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(auth, adminMiddleware);

// Static path first, so "meta" is never matched as a payout id.
router.get("/meta/summary", adminPayoutController.summary);
router.get("/", adminPayoutController.list);
router.get("/:id", adminPayoutController.getOne);
router.post("/:id/approve", adminPayoutController.approve);
router.post("/:id/reject", adminPayoutController.reject);

export default router;
