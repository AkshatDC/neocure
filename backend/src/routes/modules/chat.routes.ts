import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as ChatController from '../../controllers/chat.controller.js';

const router = Router();

router.post('/', authenticate, ChatController.chat);

export default router;
