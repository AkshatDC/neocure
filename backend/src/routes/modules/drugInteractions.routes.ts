import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as DrugInteractionController from '../../controllers/drugInteraction.controller.js';

const router = Router();

/**
 * @openapi
 * /drug-interactions/check:
 *   post:
 *     summary: Check drug-drug interactions
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drugs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Warfarin", "Aspirin"]
 *     responses:
 *       200:
 *         description: Interaction check result
 */
router.post('/check', authenticate, DrugInteractionController.checkInteractions);

/**
 * @openapi
 * /drug-interactions/history:
 *   get:
 *     summary: Get user's interaction check history
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', authenticate, DrugInteractionController.getInteractionHistory);

/**
 * @openapi
 * /drug-interactions/{id}:
 *   get:
 *     summary: Get specific interaction details
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, DrugInteractionController.getInteractionById);

export default router;
