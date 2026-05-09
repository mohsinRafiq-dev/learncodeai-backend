import express from "express";
import {
  getTodayChallenge,
  submitChallenge,
  getHistory,
  upsertChallenge,
} from "../controllers/dailyChallengeController.js";
import auth from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { codeExecLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public-ish: today's challenge (auth optional for attempt info)
router.get("/today", (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) return auth(req, res, next);
  next();
}, getTodayChallenge);

// User actions
router.post("/submit", auth, codeExecLimiter, submitChallenge);
router.get("/history", auth, getHistory);

// Admin
router.post("/", auth, adminMiddleware, upsertChallenge);

export default router;
