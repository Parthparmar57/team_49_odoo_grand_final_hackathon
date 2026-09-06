import { Router } from 'express';
import * as schedulesController from './schedules.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createScheduleSchema, updateScheduleSchema } from '../../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', schedulesController.getSchedules);
router.get('/:id', schedulesController.getScheduleById);
router.post('/', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(createScheduleSchema), schedulesController.createSchedule);
router.patch('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(updateScheduleSchema), schedulesController.updateSchedule);
router.delete('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), schedulesController.deleteSchedule);

export default router;
