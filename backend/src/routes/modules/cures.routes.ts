import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as CuresController from '../../controllers/cures.controller.js';

const router = Router();

router.get('/:allergyType', authenticate, CuresController.getCure);
router.post('/:allergyType', authenticate, authorize(['DOCTOR','ADMIN']), CuresController.upsertCure);

export default router;
