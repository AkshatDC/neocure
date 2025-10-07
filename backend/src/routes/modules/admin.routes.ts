import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as AdminController from '../../controllers/admin.controller.js';

const router = Router();

router.get('/users', authenticate, authorize(['ADMIN']), AdminController.listUsers);
router.get('/analytics', authenticate, authorize(['ADMIN']), AdminController.analytics);

export default router;
