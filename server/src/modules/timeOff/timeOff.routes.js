import { Router } from 'express';
import * as timeOffController from './timeOff.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/types', timeOffController.getTimeOffTypes);
router.get('/allocations', timeOffController.getTimeOffAllocations);
router.get('/requests', timeOffController.getTimeOffRequests);
router.post('/requests', timeOffController.createTimeOffRequest);
router.patch('/requests/:id/approve', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.approveTimeOffRequest);
router.patch('/requests/:id/refuse', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.refuseTimeOffRequest);

export default router;
