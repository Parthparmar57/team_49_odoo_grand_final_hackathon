import { AttendanceService } from './attendance.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const checkIn = async (req, res, next) => {
    try {
        let empId = req.body.employeeId || req.user.employeeId;
        if (req.user.role === 'EMPLOYEE') {
            empId = req.user.employeeId;
        }
        if (!empId) {
            return ApiResponse.error(res, 'User profile must be associated with an Employee record to check in', 'NO_EMPLOYEE_PROFILE', 400);
        }
        const record = await AttendanceService.checkIn(empId, req.body.date, req.body.correctionReason);
        return ApiResponse.success(res, record, 201);
    } catch (error) {
        next(error);
    }
};

export const checkOut = async (req, res, next) => {
    try {
        let empId = req.body.employeeId || req.user.employeeId;
        if (req.user.role === 'EMPLOYEE') {
            empId = req.user.employeeId;
        }
        if (!empId) {
            return ApiResponse.error(res, 'User profile must be associated with an Employee record to check out', 'NO_EMPLOYEE_PROFILE', 400);
        }
        const record = await AttendanceService.checkOut(empId, req.body.date, req.body.correctionReason);
        return ApiResponse.success(res, record, 200);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceRecords = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const result = await AttendanceService.getAttendanceRecords(query);
        return ApiResponse.success(res, result.records, 200, result.pagination);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceById = async (req, res, next) => {
    try {
        const record = await AttendanceService.getAttendanceById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && record.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to attendance record', 'FORBIDDEN', 403);
        }
        return ApiResponse.success(res, record);
    } catch (error) {
        next(error);
    }
};

export const correctAttendance = async (req, res, next) => {
    try {
        const record = await AttendanceService.correctAttendance(req.params.id, req.user.id, req.body);
        return ApiResponse.success(res, record);
    } catch (error) {
        next(error);
    }
};
