// Public course marketplace.
//
// Browsing is open to signed-out visitors — a catalogue nobody can see without
// an account cannot sell anything. optionalAuth attaches the user when a token
// is present so each card can be decorated with whether they already own it.

import express from "express";
import marketplaceController from "../controllers/marketplaceController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, marketplaceController.browse);
router.get("/meta/filters", marketplaceController.getFilters);
router.get("/:courseId", optionalAuth, marketplaceController.getCourse);

export default router;
