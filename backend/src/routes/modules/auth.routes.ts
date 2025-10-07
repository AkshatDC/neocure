import { Router } from 'express';
import * as AuthController from '../../controllers/auth.controller.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register user
 */
router.post('/register', AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 */
router.post('/login', AuthController.login);

router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);

export default router;
