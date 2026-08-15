import express from 'express';
import codeChatController from '../controllers/codeChatController.js';
import { auth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chargeAiCredits } from '../middleware/aiCreditMiddleware.js';

const router = express.Router();

// Send message to code editor AI chatbot.
// This route previously had neither a rate limit nor a quota, so it was the
// cheapest way to consume unlimited AI on a free account.
router.post(
  '/message',
  auth,
  aiLimiter,
  chargeAiCredits('chat'),
  codeChatController.sendMessage
);

// Clear all code chats for the user
router.delete('/clear', auth, codeChatController.clearChats);

// Get code chat history
router.get('/history', auth, codeChatController.getChatHistory);

export default router;
