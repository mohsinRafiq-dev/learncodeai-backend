import express from 'express';
import aiChatController from '../controllers/aiChatController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send message to AI chatbot
router.post('/message', auth, aiChatController.sendMessage);

// Clear all chats for the user
router.delete('/clear', auth, aiChatController.clearChats);

// Get chat history (with optional filters)
router.get('/history', auth, aiChatController.getChatHistory);

export default router;

