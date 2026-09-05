import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import departmentRouter from '../modules/departments/departments.routes.js';
import employeeRouter from '../modules/employees/employees.routes.js';
import contractRouter from '../modules/contracts/contracts.routes.js';
import scheduleRouter from '../modules/schedules/schedules.routes.js';
import attendanceRouter from '../modules/attendance/attendance.routes.js';
import timeOffRouter from '../modules/timeOff/timeOff.routes.js';
import payrollRouter from '../modules/payroll/payroll.routes.js';
import dashboardRouter from '../modules/dashboard/dashboard.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/employees', employeeRouter);
router.use('/contracts', contractRouter);
router.use('/schedules', scheduleRouter);
router.use('/attendance', attendanceRouter);
router.use('/time-off', timeOffRouter);
router.use('/payroll', payrollRouter);
router.use('/dashboard', dashboardRouter);

export {
    authRouter,
    departmentRouter,
    employeeRouter,
    contractRouter,
    scheduleRouter,
    attendanceRouter,
    timeOffRouter,
    payrollRouter,
    dashboardRouter,
};

export default router;
