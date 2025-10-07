import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as PrescriptionController from '../../controllers/prescription.controller.js';

const router = Router();

/**
 * @openapi
 * /prescriptions:
 *   get:
 *     summary: Get user's prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, PrescriptionController.getPrescriptions);

/**
 * @openapi
 * /prescriptions/add:
 *   post:
 *     summary: Add new prescription (with automatic interaction check)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drugName:
 *                 type: string
 *               dosage:
 *                 type: string
 *               frequency:
 *                 type: string
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 */
router.post('/add', authenticate, authorize(['DOCTOR', 'ADMIN']), PrescriptionController.addPrescription);

/**
 * @openapi
 * /prescriptions/{id}:
 *   put:
 *     summary: Update prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, authorize(['DOCTOR', 'ADMIN']), PrescriptionController.updatePrescription);

/**
 * @openapi
 * /prescriptions/{id}/discontinue:
 *   post:
 *     summary: Discontinue prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/discontinue', authenticate, authorize(['DOCTOR', 'ADMIN']), PrescriptionController.discontinuePrescription);

/**
 * Get interaction history for a patient
 */
router.get('/interactions/:patientId', authenticate, PrescriptionController.getInteractionHistory);

export default router;
