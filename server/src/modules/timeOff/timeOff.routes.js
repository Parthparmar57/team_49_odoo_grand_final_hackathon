import { Router } from 'express';
import * as timeOffController from './timeOff.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
    createLeaveTypeSchema,
    updateLeaveTypeSchema,
    createAllocationSchema,
    updateAllocationSchema,
    createLeaveRequestSchema,
    updateLeaveRequestSchema,
    refuseLeaveRequestSchema,
    cancelLeaveRequestSchema,
} from './timeOff.validator.js';

const router = Router();

router.use(authenticate);

// ==========================================
// TIME OFF TYPES
// ==========================================
router.get('/types', timeOffController.getTimeOffTypes);
router.get('/types/:id', timeOffController.getTimeOffTypeById);
router.post('/types', authorize(['ADMIN', 'HR_MANAGER']), validate(createLeaveTypeSchema), timeOffController.createTimeOffType);
router.patch('/types/:id', authorize(['ADMIN', 'HR_MANAGER']), validate(updateLeaveTypeSchema), timeOffController.updateTimeOffType);
router.delete('/types/:id', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.deleteTimeOffType);

// ==========================================
// ALLOCATIONS & BALANCES
// ==========================================
router.get('/allocations', timeOffController.getTimeOffAllocations);
router.get('/allocations/:id', timeOffController.getTimeOffAllocationById);
router.post('/allocations', authorize(['ADMIN', 'HR_MANAGER']), validate(createAllocationSchema), timeOffController.createAllocation);
router.patch('/allocations/:id', authorize(['ADMIN', 'HR_MANAGER']), validate(updateAllocationSchema), timeOffController.updateAllocation);
router.delete('/allocations/:id', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.deleteAllocation);
router.get('/employees/:employeeId/balance', timeOffController.getEmployeeBalance);

// ==========================================
// LEAVE REQUESTS & WORKFLOWS
// ==========================================
router.post('/requests', validate(createLeaveRequestSchema), timeOffController.createLeaveRequest);
router.get('/requests', timeOffController.getTimeOffRequests);
router.get('/requests/:id', timeOffController.getTimeOffRequestById);
router.patch('/requests/:id', validate(updateLeaveRequestSchema), timeOffController.updateLeaveRequest);
router.delete('/requests/:id', timeOffController.deleteLeaveRequest);

// Workflow endpoints
router.post('/requests/:id/approve', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.approveLeaveRequest);
router.patch('/requests/:id/approve', authorize(['ADMIN', 'HR_MANAGER']), timeOffController.approveLeaveRequest);

router.post('/requests/:id/refuse', authorize(['ADMIN', 'HR_MANAGER']), validate(refuseLeaveRequestSchema), timeOffController.refuseLeaveRequest);
router.patch('/requests/:id/refuse', authorize(['ADMIN', 'HR_MANAGER']), validate(refuseLeaveRequestSchema), timeOffController.refuseLeaveRequest);

router.post('/requests/:id/cancel', validate(cancelLeaveRequestSchema), timeOffController.cancelLeaveRequest);
router.patch('/requests/:id/cancel', validate(cancelLeaveRequestSchema), timeOffController.cancelLeaveRequest);

export default router;
