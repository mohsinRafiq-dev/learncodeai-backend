import express from "express";
import { subscribe, unsubscribe, getStatus } from "../controllers/newsletterController.js";

const router = express.Router();

// Newsletter subscription routes
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);
router.get("/status", getStatus);

export default router;
