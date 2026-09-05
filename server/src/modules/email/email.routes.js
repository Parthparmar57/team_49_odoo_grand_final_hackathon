import { Router } from 'express';
import * as emailController from './email.controller.js';

const router = Router();

router.get('/logs', emailController.getEmailLogs);
router.post('/inbound', emailController.handleInboundEmail);

export default router;
