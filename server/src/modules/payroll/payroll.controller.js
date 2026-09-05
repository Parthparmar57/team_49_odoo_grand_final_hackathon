import { PayrollService } from './payroll.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getSalaryStructures = async (req, res, next) => {
    try {
        const structures = await PayrollService.getSalaryStructures();
        return ApiResponse.success(res, structures);
    } catch (error) {
        next(error);
    }
};

export const getPayruns = async (req, res, next) => {
    try {
        const payruns = await PayrollService.getPayruns();
        return ApiResponse.success(res, payruns);
    } catch (error) {
        next(error);
    }
};

export const createPayrun = async (req, res, next) => {
    try {
        const payrun = await PayrollService.createPayrun(req.body);
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
        const payrun = await PayrollService.computePayrun(req.params.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const validatePayrun = async (req, res, next) => {
    try {
        const payrun = await PayrollService.validatePayrun(req.params.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const markPayrunPaid = async (req, res, next) => {
    try {
        const payrun = await PayrollService.markPayrunPaid(req.params.id);
        return ApiResponse.success(res, payrun);
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
        const pdfBuffer = await PayrollService.downloadPayslipPdf(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.payslipNumber}.pdf`);
        return res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
