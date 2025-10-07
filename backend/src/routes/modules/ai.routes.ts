import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as AIController from '../../controllers/ai.controller.js';

const router = Router();

router.post('/allergy-detection', authenticate, AIController.allergyDetection);
router.post('/medicine-alternatives', authenticate, AIController.medicineAlternatives);
router.post('/symptom-check', authenticate, AIController.symptomCheck);
router.get('/explain/:id', authenticate, AIController.getExplanation);

export default router;
