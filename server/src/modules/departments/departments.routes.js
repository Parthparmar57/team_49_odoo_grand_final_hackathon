import { Router } from 'express';
import * as departmentsController from './departments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../../schemas/index.js';

const router = Router();

router.use(authenticate);

router.get('/', departmentsController.getDepartments);
router.get('/:id', departmentsController.getDepartmentById);
router.post('/', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(createDepartmentSchema), departmentsController.createDepartment);
router.patch('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(updateDepartmentSchema), departmentsController.updateDepartment);
router.delete('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), departmentsController.deleteDepartment);

export default router;
