import express from 'express';
import tutorialController from '../controllers/tutorialController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - view tutorials
router.get('/', tutorialController.getAllTutorials);
router.get('/languages', tutorialController.getLanguages);
router.get('/language/:language', tutorialController.getTutorialsByLanguage);
router.get('/concepts/:language', tutorialController.getConceptsByLanguage);
router.get('/:id', tutorialController.getTutorialById);

// Protected routes - save/manage tutorials
router.post('/save', auth, tutorialController.saveTutorial);
router.get('/user/saved', auth, tutorialController.getSavedTutorials);
router.delete('/saved/:tutorialId', auth, tutorialController.unsaveTutorial);
router.put('/progress/:tutorialId', auth, tutorialController.updateTutorialProgress);

// User's created tutorials
router.get('/user/created', auth, tutorialController.getUserCreatedTutorials);
router.delete('/user/created/:id', auth, tutorialController.deleteUserTutorial);

// Create custom tutorial (for future AI integration)
router.post('/create', auth, tutorialController.createTutorial);

export default router;

