import express from 'express';
import aiChatController from '../controllers/aiChatController.js';
import { auth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Send message to AI chatbot
router.post('/message', auth, aiLimiter, aiChatController.sendMessage);

// Clear all chats for the user (or a single conversation if ?conversationId=)
router.delete('/clear', auth, aiChatController.clearChats);

// Get chat history (with optional filters: context, contextId, conversationId)
router.get('/history', auth, aiChatController.getChatHistory);

// Token usage summary for current user
router.get('/usage', auth, aiChatController.getUsage);

export default router;

