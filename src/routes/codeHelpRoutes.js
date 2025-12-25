import express from 'express';
import codeHelpController from '../controllers/codeHelpController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get explanation for an error (teaching mode - no solutions)
router.post('/error-explanation', auth, codeHelpController.getErrorExplanation);

// Get hint for a problem (teaching mode - guidance only)
router.post('/problem-hint', auth, codeHelpController.getProblemHint);

// Ask a code question (teaching mode - no code)
router.post('/ask-question', auth, codeHelpController.askCodeQuestion);

export default router;

