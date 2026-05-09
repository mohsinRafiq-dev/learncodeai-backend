import express from 'express';
import codeExecutionController from '../controllers/codeExecutionController.js';
import { codeExecLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/execute', codeExecLimiter, codeExecutionController.executeCode);
router.get('/languages', codeExecutionController.getLanguages);

export default router;
