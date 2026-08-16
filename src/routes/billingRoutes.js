// Billing routes — Stripe checkout, portal, webhook.
// Webhook is mounted separately in app.js because it needs raw body parsing.

import express from "express";
import billingController from "../controllers/billingController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: the pricing page reads this so it can never quote a price that
// differs from what Stripe charges.
router.get("/plans", billingController.getPlans);

router.get("/me", auth, billingController.getMyBilling);
router.get("/ai-credits", auth, billingController.getAiCredits);
router.post("/courses/:courseId/checkout", auth, billingController.createCourseCheckout);
router.post("/create-checkout-session", auth, billingController.createCheckoutSession);
router.post("/create-portal-session", auth, billingController.createPortalSession);

export default router;
