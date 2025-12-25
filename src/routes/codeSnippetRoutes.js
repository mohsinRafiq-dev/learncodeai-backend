import express from "express";
import * as codeSnippetController from "../controllers/codeSnippetController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all snippets for the authenticated user
router.get("/", auth, codeSnippetController.getUserSnippets);

// Get a single snippet by ID
router.get("/:id", auth, codeSnippetController.getSnippetById);

// Create a new snippet
router.post("/", auth, codeSnippetController.createSnippet);

// Update a snippet
router.put("/:id", auth, codeSnippetController.updateSnippet);

// Delete a snippet
router.delete("/:id", auth, codeSnippetController.deleteSnippet);

export default router;

