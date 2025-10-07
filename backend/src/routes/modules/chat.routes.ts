import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as ChatController from '../../controllers/chat.controller.js';

const router = Router();

// Chat with AI
router.post('/', authenticate, ChatController.chat);

// Get chat history
router.get('/history', authenticate, ChatController.getChatHistory);

export default router;
