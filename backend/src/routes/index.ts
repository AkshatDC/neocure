import { Router } from 'express';
import auth from './modules/auth.routes.js';
import records from './modules/records.routes.js';
import ai from './modules/ai.routes.js';
import reminders from './modules/reminders.routes.js';
import cures from './modules/cures.routes.js';
import admin from './modules/admin.routes.js';
import chat from './modules/chat.routes.js';
import drugInteractions from './modules/drugInteractions.routes.js';
import prescriptions from './modules/prescriptions.routes.js';
import alerts from './modules/alerts.routes.js';

const router = Router();

router.use('/auth', auth);
router.use('/records', records);
router.use('/ai', ai);
router.use('/reminders', reminders);
router.use('/cures', cures);
router.use('/admin', admin);
router.use('/chat', chat);
router.use('/drug-interactions', drugInteractions);
router.use('/prescriptions', prescriptions);
router.use('/alerts', alerts);

export default router;
