import { DashboardService } from './dashboard.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getOverview = async (req, res, next) => {
    try {
        const overview = await DashboardService.getOverview();
        return ApiResponse.success(res, overview);
    } catch (error) {
        next(error);
    }
};

export const getPayrollMetrics = async (req, res, next) => {
    try {
        const metrics = await DashboardService.getPayrollMetrics();
        return ApiResponse.success(res, metrics);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceMetrics = async (req, res, next) => {
    try {
        const metrics = await DashboardService.getAttendanceMetrics();
        return ApiResponse.success(res, metrics);
    } catch (error) {
        next(error);
    }
};

export const getTimeOffMetrics = async (req, res, next) => {
    try {
        const metrics = await DashboardService.getTimeOffMetrics();
        return ApiResponse.success(res, metrics);
    } catch (error) {
        next(error);
    }
};
