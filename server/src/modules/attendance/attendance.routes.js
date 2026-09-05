import { Router } from 'express';
import * as attendanceController from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { checkInSchema, checkOutSchema, correctAttendanceSchema } from '../../schemas/index.js';

const router = Router();

router.use(authenticate);

router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);
router.get('/', attendanceController.getAttendanceRecords);
router.get('/:id', attendanceController.getAttendanceById);
router.patch('/:id', authorize(['ADMIN', 'HR_MANAGER']), validate(correctAttendanceSchema), attendanceController.correctAttendance);

export default router;
