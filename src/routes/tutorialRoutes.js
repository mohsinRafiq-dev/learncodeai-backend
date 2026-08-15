import express from 'express';
import tutorialController from '../controllers/tutorialController.js';
import auth, { optionalAuth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  chargeAiCredits,
  requirePlanFeature,
} from '../middleware/aiCreditMiddleware.js';

const router = express.Router();

// Public routes - view tutorials
router.get('/', tutorialController.getAllTutorials);
router.get('/languages', tutorialController.getLanguages);
router.get('/language/:language', tutorialController.getTutorialsByLanguage);
router.get('/concepts/:language', tutorialController.getConceptsByLanguage);
// optionalAuth so the controller can check req.user.subscriptionTier for gating
router.get('/:id', optionalAuth, tutorialController.getTutorialById);

// Protected routes - save/manage tutorials
router.post('/save', auth, tutorialController.saveTutorial);
router.get('/user/saved', auth, tutorialController.getSavedTutorials);
router.delete('/saved/:tutorialId', auth, tutorialController.unsaveTutorial);
router.put('/progress/:tutorialId', auth, tutorialController.updateTutorialProgress);

// User's created tutorials
router.get('/user/created', auth, tutorialController.getUserCreatedTutorials);
router.delete('/user/created/:id', auth, tutorialController.deleteUserTutorial);

// Create a tutorial. When the request asks for AI generation this runs the
// verified pipeline — retrieval, generation, sandbox execution per snippet, and
// repair round-trips — so it is the most expensive action on the platform and
// is gated to Pro. Manual (non-AI) creation stays free and is let through by
// the conditional below.
const aiGenerationGate = (req, res, next) => {
  const wantsAi = Array.isArray(req.body?.tags) && req.body.tags.includes('AI-generated');
  if (!wantsAi) return next();

  return requirePlanFeature('verifiedGeneration')(req, res, () =>
    aiLimiter(req, res, () =>
      chargeAiCredits('verified_generation')(req, res, next)
    )
  );
};

router.post('/create', auth, aiGenerationGate, tutorialController.createTutorial);

export default router;

