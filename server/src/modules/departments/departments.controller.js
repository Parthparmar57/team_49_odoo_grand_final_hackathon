import { DepartmentsService } from './departments.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getDepartments = async (req, res, next) => {
    try {
        const departments = await DepartmentsService.getDepartments();
        return ApiResponse.success(res, departments);
    } catch (error) {
        next(error);
    }
};

export const getDepartmentById = async (req, res, next) => {
    try {
        const department = await DepartmentsService.getDepartmentById(req.params.id);
        return ApiResponse.success(res, department);
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req, res, next) => {
    try {
        const department = await DepartmentsService.createDepartment(req.body);
        return ApiResponse.success(res, department, 201);
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    try {
        const department = await DepartmentsService.updateDepartment(req.params.id, req.body);
        return ApiResponse.success(res, department);
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        await DepartmentsService.deleteDepartment(req.params.id);
        return ApiResponse.success(res, { message: 'Department deleted successfully' });
    } catch (error) {
        next(error);
    }
};
