import { TimeOffService } from './timeOff.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getTimeOffTypes = async (req, res, next) => {
    try {
        const types = await TimeOffService.getTimeOffTypes();
        return ApiResponse.success(res, types);
    } catch (error) {
        next(error);
    }
};

export const getTimeOffAllocations = async (req, res, next) => {
    try {
        const empId = req.params.employeeId || req.user.employeeId;
        const allocations = await TimeOffService.getTimeOffAllocations(empId);
        return ApiResponse.success(res, allocations);
    } catch (error) {
        next(error);
    }
};

export const getTimeOffRequests = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const requests = await TimeOffService.getTimeOffRequests(query);
        return ApiResponse.success(res, requests);
    } catch (error) {
        next(error);
    }
};

export const createTimeOffRequest = async (req, res, next) => {
    try {
        const empId = req.body.employeeId || req.user.employeeId;
        if (!empId) {
            return ApiResponse.error(res, 'User must be associated with an Employee profile to submit time off requests', 'NO_EMPLOYEE_PROFILE', 400);
        }
        const request = await TimeOffService.createTimeOffRequest({ ...req.body, employeeId: empId });
        return ApiResponse.success(res, request, 201);
    } catch (error) {
        next(error);
    }
};

export const approveTimeOffRequest = async (req, res, next) => {
    try {
        const request = await TimeOffService.approveTimeOffRequest(req.params.id, req.user.id);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};

export const refuseTimeOffRequest = async (req, res, next) => {
    try {
        const request = await TimeOffService.refuseTimeOffRequest(req.params.id, req.user.id, req.body.rejectionReason);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};
