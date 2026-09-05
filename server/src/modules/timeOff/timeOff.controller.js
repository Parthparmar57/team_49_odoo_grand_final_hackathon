import { TimeOffService } from './timeOff.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

// ==========================================
// TIME OFF TYPES
// ==========================================

export const getTimeOffTypes = async (req, res, next) => {
    try {
        const includeInactive = req.user.role === 'ADMIN' || req.user.role === 'HR_MANAGER';
        const types = await TimeOffService.getTimeOffTypes(includeInactive);
        return ApiResponse.success(res, types);
    } catch (error) {
        next(error);
    }
};

export const getTimeOffTypeById = async (req, res, next) => {
    try {
        const type = await TimeOffService.getTimeOffTypeById(req.params.id);
        return ApiResponse.success(res, type);
    } catch (error) {
        next(error);
    }
};

export const createTimeOffType = async (req, res, next) => {
    try {
        const type = await TimeOffService.createTimeOffType(req.body);
        return ApiResponse.success(res, type, 201);
    } catch (error) {
        next(error);
    }
};

export const updateTimeOffType = async (req, res, next) => {
    try {
        const type = await TimeOffService.updateTimeOffType(req.params.id, req.body);
        return ApiResponse.success(res, type);
    } catch (error) {
        next(error);
    }
};

export const deleteTimeOffType = async (req, res, next) => {
    try {
        const result = await TimeOffService.deleteTimeOffType(req.params.id);
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// ALLOCATIONS & BALANCES
// ==========================================

export const getTimeOffAllocations = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const allocations = await TimeOffService.getTimeOffAllocations(query);
        return ApiResponse.success(res, allocations);
    } catch (error) {
        next(error);
    }
};

export const getTimeOffAllocationById = async (req, res, next) => {
    try {
        const allocation = await TimeOffService.getTimeOffAllocationById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && allocation.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to leave allocation', 'FORBIDDEN', 403);
        }
        return ApiResponse.success(res, allocation);
    } catch (error) {
        next(error);
    }
};

export const createAllocation = async (req, res, next) => {
    try {
        const allocation = await TimeOffService.createAllocation(req.body);
        return ApiResponse.success(res, allocation, 201);
    } catch (error) {
        next(error);
    }
};

export const updateAllocation = async (req, res, next) => {
    try {
        const allocation = await TimeOffService.updateAllocation(req.params.id, req.body);
        return ApiResponse.success(res, allocation);
    } catch (error) {
        next(error);
    }
};

export const deleteAllocation = async (req, res, next) => {
    try {
        const result = await TimeOffService.deleteAllocation(req.params.id);
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

export const getEmployeeBalance = async (req, res, next) => {
    try {
        const targetEmpId = req.params.employeeId || req.user.employeeId;
        if (req.user.role === 'EMPLOYEE' && targetEmpId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to employee balance', 'FORBIDDEN', 403);
        }
        const balance = await TimeOffService.getEmployeeBalance(targetEmpId);
        return ApiResponse.success(res, balance);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// LEAVE REQUESTS & WORKFLOWS
// ==========================================

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

export const getTimeOffRequestById = async (req, res, next) => {
    try {
        const request = await TimeOffService.getTimeOffRequestById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && request.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to leave request', 'FORBIDDEN', 403);
        }
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};

export const createLeaveRequest = async (req, res, next) => {
    try {
        let targetEmpId = req.body.employeeId;
        if (req.user.role === 'EMPLOYEE' || !targetEmpId) {
            targetEmpId = req.user.employeeId;
        }

        if (!targetEmpId) {
            return ApiResponse.error(res, 'User profile must be associated with an Employee profile to submit leave requests', 'NO_EMPLOYEE_PROFILE', 400);
        }

        const request = await TimeOffService.createLeaveRequest({ ...req.body, employeeId: targetEmpId }, req.user.id);
        return ApiResponse.success(res, request, 201);
    } catch (error) {
        next(error);
    }
};

export const updateLeaveRequest = async (req, res, next) => {
    try {
        const existing = await TimeOffService.getTimeOffRequestById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && existing.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized to edit this leave request', 'FORBIDDEN', 403);
        }

        const request = await TimeOffService.updateLeaveRequest(req.params.id, req.user.id, req.body);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};

export const deleteLeaveRequest = async (req, res, next) => {
    try {
        const existing = await TimeOffService.getTimeOffRequestById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && existing.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized to delete this leave request', 'FORBIDDEN', 403);
        }

        const result = await TimeOffService.deleteLeaveRequest(req.params.id, req.user.id);
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

export const approveLeaveRequest = async (req, res, next) => {
    try {
        const request = await TimeOffService.approveLeaveRequest(req.params.id, req.user.id);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};

export const refuseLeaveRequest = async (req, res, next) => {
    try {
        const request = await TimeOffService.refuseLeaveRequest(req.params.id, req.user.id, req.body.rejectionReason);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};

export const cancelLeaveRequest = async (req, res, next) => {
    try {
        const existing = await TimeOffService.getTimeOffRequestById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && existing.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized to cancel this leave request', 'FORBIDDEN', 403);
        }

        const request = await TimeOffService.cancelLeaveRequest(req.params.id, req.user.id, req.body.cancellationReason);
        return ApiResponse.success(res, request);
    } catch (error) {
        next(error);
    }
};
