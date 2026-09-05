import { Router } from 'express';
import * as payrollController from './payroll.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// Salary Structures
router.get('/structures', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getSalaryStructures);
router.post('/structures', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.createSalaryStructure);
router.get('/structures/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getSalaryStructureById);
router.patch('/structures/:id', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.updateSalaryStructure);

// Payruns
router.get('/payruns', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getPayruns);
router.post('/payruns', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.createPayrun);
router.get('/payruns/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getPayrunById);
router.post('/payruns/:id/compute', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.computePayrun);
router.post('/payruns/:id/validate', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.validatePayrun);
router.post('/payruns/:id/pay', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.markPayrunPaid);

// Payslips
router.get('/payslips', payrollController.getPayslips);
router.get('/payslips/:id', payrollController.getPayslipById);
router.get('/payslips/:id/pdf', payrollController.downloadPayslipPdf);

export default router;
