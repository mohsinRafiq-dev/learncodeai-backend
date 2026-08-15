import express from 'express';
import codeHelpController from '../controllers/codeHelpController.js';
import { auth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chargeAiCredits } from '../middleware/aiCreditMiddleware.js';

const router = express.Router();

// Get explanation for an error (teaching mode - no solutions)
router.post('/error-explanation', auth, aiLimiter, chargeAiCredits('code_help'), codeHelpController.getErrorExplanation);

// Get hint for a problem (teaching mode - guidance only)
router.post('/problem-hint', auth, aiLimiter, chargeAiCredits('code_help'), codeHelpController.getProblemHint);

// Ask a code question (teaching mode - no code)
router.post('/ask-question', auth, aiLimiter, chargeAiCredits('code_help'), codeHelpController.askCodeQuestion);

// Get code optimization suggestions
router.post('/optimize', auth, aiLimiter, chargeAiCredits('code_help'), codeHelpController.getCodeOptimization);

// Submit thumbs up/down feedback on an AI suggestion
router.post('/feedback', auth, codeHelpController.submitFeedback);

// Aggregate feedback stats (helpful for analytics dashboard)
router.get('/feedback/stats', auth, codeHelpController.getFeedbackStats);

export default router;

