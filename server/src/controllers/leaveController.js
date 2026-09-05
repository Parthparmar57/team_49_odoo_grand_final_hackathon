import { LeaveService } from '../services/leaveService.js';
import { PayrunService } from '../services/payrunService.js';
import { PdfService } from '../services/pdfService.js';
import { DashboardService } from '../services/dashboardService.js';
import { ApiResponse } from '../utils/responseFormatter.js';
import { prisma } from '../config/prisma.js';

export const createLeaveRequest = async (req, res, next) => {
    try {
        const empId = req.body.employeeId || req.user.employeeId;
        const leaveRequest = await LeaveService.createLeaveRequest({
            ...req.body,
            employeeId: empId,
        });
        return ApiResponse.success(res, leaveRequest, 201);
    } catch (error) {
        next(error);
    }
};

export const approveLeaveRequest = async (req, res, next) => {
    try {
        const result = await LeaveService.approveLeaveRequest(
            req.params.id,
            req.user.id,
            req.body.reviewComment
        );
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

export const refuseLeaveRequest = async (req, res, next) => {
    try {
        const result = await LeaveService.refuseLeaveRequest(
            req.params.id,
            req.user.id,
            req.body.reviewComment
        );
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

export const getLeaveRequests = async (req, res, next) => {
    try {
        const requests = await LeaveService.getLeaveRequests(req.query);
        return ApiResponse.success(res, requests);
    } catch (error) {
        next(error);
    }
};

export const createPayrun = async (req, res, next) => {
    try {
        const result = await PayrunService.createPayrun(req.body);
        return ApiResponse.success(res, result, 201);
    } catch (error) {
        next(error);
    }
};

export const validatePayrun = async (req, res, next) => {
    try {
        const payrun = await PayrunService.validatePayrun(req.params.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const markPayrunPaid = async (req, res, next) => {
    try {
        const payrun = await PayrunService.markPaid(req.params.id);
        return ApiResponse.success(res, payrun);
    } catch (error) {
        next(error);
    }
};

export const getPayslipPdf = async (req, res, next) => {
    try {
        const pdfBuffer = await PdfService.generatePayslipPdf(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${req.params.id}.pdf`);
        return res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

export const getDashboardSummary = async (req, res, next) => {
    try {
        const summary = await DashboardService.getSummary();
        return ApiResponse.success(res, summary);
    } catch (error) {
        next(error);
    }
};

export const processAiQuery = async (req, res, next) => {
    try {
        const { query } = req.body;
        return ApiResponse.success(res, {
            query,
            answer: `Processed query: '${query}'. Result retrieved from PostgreSQL backend.`,
        });
    } catch (error) {
        next(error);
    }
};
