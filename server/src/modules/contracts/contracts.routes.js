import { Router } from 'express';
import * as contractsController from './contracts.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createContractSchema, updateContractSchema } from '../../schemas/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']), contractsController.getContracts);
router.get('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']), contractsController.getContractById);
router.post('/', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(createContractSchema), contractsController.createContract);
router.patch('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), validate(updateContractSchema), contractsController.updateContract);
router.delete('/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), contractsController.deleteContract);

export default router;
