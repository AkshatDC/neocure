import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as RemindersController from '../../controllers/reminders.controller.js';

const router = Router();

router.get('/', authenticate, RemindersController.listReminders);
router.post('/', authenticate, RemindersController.createReminder);
router.put('/:id', authenticate, RemindersController.updateReminder);
router.delete('/:id', authenticate, RemindersController.deleteReminder);

export default router;
