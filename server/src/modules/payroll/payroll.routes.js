import { Router } from 'express';
import * as payrollController from './payroll.controller.js';
import * as structuresController from './structures.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

// ==========================================
// SALARY STRUCTURES & RULES (RBAC ENFORCED)
// Read: ADMIN, HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER
// Write/Edit: ADMIN, HR_PAYROLL_MANAGER (HR_MANAGER & HR_PAYROLL_USER restricted)
// ==========================================
router.get('/structures', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), structuresController.getStructures);
router.post('/structures', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.createStructure);
router.get('/structures/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), structuresController.getStructureById);
router.patch('/structures/:id', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.updateStructure);
router.delete('/structures/:id', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.deleteStructure);

// Rules Endpoints
router.post('/structures/:id/rules', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.addRule);
router.patch('/structures/:id/rules/:ruleId', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.updateRule);
router.delete('/structures/:id/rules/:ruleId', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), structuresController.deleteRule);

// ==========================================
// PAYRUNS (RBAC ENFORCED)
// Read: ADMIN, HR_MANAGER, HR_PAYROLL_USER, HR_PAYROLL_MANAGER
// Write (Create/Compute): ADMIN, HR_PAYROLL_MANAGER, HR_PAYROLL_USER (HR_MANAGER restricted)
// Validate / Mark Paid: ADMIN, HR_PAYROLL_MANAGER
// ==========================================
router.get('/payruns', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getPayruns);
router.post('/payruns', authorize(['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']), payrollController.createPayrun);
router.get('/payruns/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']), payrollController.getPayrunById);
router.post('/payruns/:id/compute', authorize(['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']), payrollController.computePayrun);
router.post('/payruns/:id/validate', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.validatePayrun);
router.post('/payruns/:id/pay', authorize(['ADMIN', 'HR_PAYROLL_MANAGER']), payrollController.markPayrunPaid);

// ==========================================
// PAYSLIPS
// ==========================================
router.get('/payslips', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']), payrollController.getPayslips);
router.get('/payslips/:id', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']), payrollController.getPayslipById);
router.get('/payslips/:id/pdf', authorize(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']), payrollController.downloadPayslipPdf);

export default router;

