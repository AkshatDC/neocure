import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as RecordsController from '../../controllers/records.controller.js';

const router = Router();

router.get('/', authenticate, RecordsController.listRecords);
router.post('/', authenticate, RecordsController.createRecord);
router.get('/:id', authenticate, RecordsController.getRecord);

export default router;
