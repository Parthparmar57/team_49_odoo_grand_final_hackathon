import { PayrollService } from './payroll.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

// ==========================================
// SALARY STRUCTURES
// ==========================================
export const getSalaryStructures = async (req, res, next) => {
    try {
        const structures = await PayrollService.getSalaryStructures();
        return ApiResponse.success(res, structures);
    } catch (error) {
        next(error);
    }
};

export const getSalaryStructureById = async (req, res, next) => {
    try {
        const structure = await PayrollService.getSalaryStructureById(req.params.id);
        return ApiResponse.success(res, structure);
    } catch (error) {
        next(error);
    }
};

export const createSalaryStructure = async (req, res, next) => {
    try {
        const structure = await PayrollService.createSalaryStructure(req.body);
        return ApiResponse.success(res, structure, 201);
    } catch (error) {
        next(error);
    }
};

export const updateSalaryStructure = async (req, res, next) => {
    try {
        const structure = await PayrollService.updateSalaryStructure(req.params.id, req.body);
        return ApiResponse.success(res, structure);
    } catch (error) {
        next(error);
    }
};

export const getPayruns = async (req, res, next) => {
    try {
        const payruns = await PayrollService.getPayruns(req.query);
        return ApiResponse.success(res, payruns);
    } catch (error) {
        next(error);
    }
};

export const createPayrun = async (req, res, next) => {
    try {
        const payrun = await PayrollService.createPayrun(req.body, req.user.id);
        return ApiResponse.success(res, payrun, 201);
    } catch (error) {
        next(error);
    }
};

export const getPayrunById = async (req, res, next) => {
    try {
        const payrun = await PayrollService.getPayrunById(req.params.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const computePayrun = async (req, res, next) => {
    try {
        const payrun = await PayrollService.computePayrun(req.params.id, req.user.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const validatePayrun = async (req, res, next) => {
    try {
        const payrun = await PayrollService.validatePayrun(req.params.id, req.user.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const markPayrunPaid = async (req, res, next) => {
    try {
        const payrun = await PayrollService.markPayrunPaid(req.params.id, req.user.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const getPayslips = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const payslips = await PayrollService.getPayslips(query);
        return ApiResponse.success(res, payslips);
    } catch (error) {
        next(error);
    }
};

export const getPayslipById = async (req, res, next) => {
    try {
        const payslip = await PayrollService.getPayslipById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && payslip.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to payslip', 'FORBIDDEN', 403);
        }
        return ApiResponse.success(res, payslip);
    } catch (error) {
        next(error);
    }
};

export const downloadPayslipPdf = async (req, res, next) => {
    try {
        const payslip = await PayrollService.getPayslipById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && payslip.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to payslip', 'FORBIDDEN', 403);
        }
        const pdfBuffer = await PayrollService.downloadPayslipPdf(req.params.id, req.user.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.payslipRef}.pdf`);
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.payslipRef}.pdf`);
        return res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
