import { SchedulesService } from './schedules.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getSchedules = async (req, res, next) => {
    try {
        const schedules = await SchedulesService.getSchedules();
        return ApiResponse.success(res, schedules);
    } catch (error) {
        next(error);
    }
};

export const getScheduleById = async (req, res, next) => {
    try {
        const schedule = await SchedulesService.getScheduleById(req.params.id);
        return ApiResponse.success(res, schedule);
    } catch (error) {
        next(error);
    }
};

export const createSchedule = async (req, res, next) => {
    try {
        const schedule = await SchedulesService.createSchedule(req.body);
        return ApiResponse.success(res, schedule, 201);
    } catch (error) {
        next(error);
    }
};

export const updateSchedule = async (req, res, next) => {
    try {
        const schedule = await SchedulesService.updateSchedule(req.params.id, req.body);
        return ApiResponse.success(res, schedule);
    } catch (error) {
        next(error);
    }
};

export const deleteSchedule = async (req, res, next) => {
    try {
        await SchedulesService.deleteSchedule(req.params.id);
        return ApiResponse.success(res, { message: 'Schedule deleted successfully' });
    } catch (error) {
        next(error);
    }
};
