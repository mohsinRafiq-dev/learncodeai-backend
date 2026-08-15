import express from 'express';
import aiChatController from '../controllers/aiChatController.js';
import { auth } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { chargeAiCredits } from '../middleware/aiCreditMiddleware.js';

const router = express.Router();

// Send message to AI chatbot.
// aiLimiter is an IP-level burst guard; chargeAiCredits is the per-account
// monthly quota that the pricing page actually advertises.
router.post(
  '/message',
  auth,
  aiLimiter,
  chargeAiCredits('chat'),
  aiChatController.sendMessage
);

// Clear all chats for the user (or a single conversation if ?conversationId=)
router.delete('/clear', auth, aiChatController.clearChats);

// Get chat history (with optional filters: context, contextId, conversationId)
router.get('/history', auth, aiChatController.getChatHistory);

// Token usage summary for current user
router.get('/usage', auth, aiChatController.getUsage);

export default router;

