import express from "express";
import {
  getMyDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
} from "../controllers/codeDraftController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(auth);

router.get("/", getMyDrafts);
router.get("/:language", getDraft);
router.put("/:language", saveDraft);
router.delete("/:language", deleteDraft);

export default router;
