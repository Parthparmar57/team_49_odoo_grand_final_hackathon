import { DepartmentService } from '../services/departmentService.js';
import { ScheduleService } from '../services/scheduleService.js';
import { AttendanceService } from '../services/attendanceService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

export const getDepartments = async (req, res, next) => {
    try {
        const departments = await DepartmentService.getDepartments();
        return ApiResponse.success(res, departments);
    } catch (error) {
        next(error);
    }
};

export const getDepartmentById = async (req, res, next) => {
    try {
        const department = await DepartmentService.getDepartmentById(req.params.id);
        return ApiResponse.success(res, department);
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req, res, next) => {
    try {
        const department = await DepartmentService.createDepartment(req.body);
        return ApiResponse.success(res, department, 201);
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    try {
        const department = await DepartmentService.updateDepartment(req.params.id, req.body);
        return ApiResponse.success(res, department);
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        await DepartmentService.deleteDepartment(req.params.id);
        return ApiResponse.success(res, { message: 'Department deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getSchedules = async (req, res, next) => {
    try {
        const schedules = await ScheduleService.getSchedules();
        return ApiResponse.success(res, schedules);
    } catch (error) {
        next(error);
    }
};

export const getScheduleById = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.getScheduleById(req.params.id);
        return ApiResponse.success(res, schedule);
    } catch (error) {
        next(error);
    }
};

export const createSchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.createSchedule(req.body);
        return ApiResponse.success(res, schedule, 201);
    } catch (error) {
        next(error);
    }
};

export const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.updateSchedule(req.params.id, req.body);
        return ApiResponse.success(res, schedule);
    } catch (error) {
        next(error);
    }
};

export const deleteSchedule = async (req, res, next) => {
    try {
        await ScheduleService.deleteSchedule(req.params.id);
        return ApiResponse.success(res, { message: 'Schedule deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const checkIn = async (req, res, next) => {
    try {
        const empId = req.body.employeeId || req.user.employeeId;
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
        const empId = req.body.employeeId || req.user.employeeId;
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
        const records = await AttendanceService.getAttendanceRecords(query);
        return ApiResponse.success(res, records);
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
