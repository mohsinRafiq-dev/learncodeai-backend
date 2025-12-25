import express from 'express';
import codeExecutionController from '../controllers/codeExecutionController.js';

const router = express.Router();

router.post('/execute', codeExecutionController.executeCode);
router.get('/languages', codeExecutionController.getLanguages);

export default router;
