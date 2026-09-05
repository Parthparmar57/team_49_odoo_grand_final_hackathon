import { Router } from 'express';
import * as employeesController from './employees.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), employeesController.getEmployees);
router.get('/:id', employeesController.getEmployeeById);
router.post('/', authorize(['ADMIN', 'HR_MANAGER']), validate(createEmployeeSchema), employeesController.createEmployee);
router.patch('/:id', authorize(['ADMIN', 'HR_MANAGER']), validate(updateEmployeeSchema), employeesController.updateEmployee);
router.delete('/:id', authorize(['ADMIN', 'HR_MANAGER']), employeesController.deleteEmployee);

export default router;
