import express from 'express';
import tutorialController from '../controllers/tutorialController.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin tutorial routes
router.use(auth);
router.use(adminMiddleware);

// Admin tutorial CRUD routes
router.get('/', tutorialController.adminGetAllTutorials);
router.post('/', tutorialController.adminCreateTutorial);
router.put('/:id', tutorialController.adminUpdateTutorial);
router.delete('/:id', tutorialController.adminDeleteTutorial);

export default router;

