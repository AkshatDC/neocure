import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as RecordsController from '../../controllers/records.controller.js';

const router = Router();

// Medical records CRUD
router.get('/', authenticate, RecordsController.listRecords);
router.post('/', authenticate, RecordsController.createRecord);
router.get('/:id', authenticate, RecordsController.getRecord);
router.put('/:id', authenticate, RecordsController.updateRecord);
router.delete('/:id', authenticate, RecordsController.deleteRecord);

// Document upload with OCR
router.post('/upload', authenticate, RecordsController.upload.single('document'), RecordsController.uploadDocument);

export default router;
