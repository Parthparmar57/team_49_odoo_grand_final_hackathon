import { EmployeesService } from './employees.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getEmployees = async (req, res, next) => {
    try {
        const result = await EmployeesService.getEmployees(req.query);
        return ApiResponse.success(res, result.employees, 200, result.pagination);
    } catch (error) {
        next(error);
    }
};

export const getEmployeeById = async (req, res, next) => {
    try {
        if (req.user.role === 'EMPLOYEE' && req.user.employeeId !== req.params.id) {
            return ApiResponse.error(res, 'Unauthorized access to employee record', 'FORBIDDEN', 403);
        }
        const employee = await EmployeesService.getEmployeeById(req.params.id);
        return ApiResponse.success(res, employee);
    } catch (error) {
        next(error);
    }
};

export const createEmployee = async (req, res, next) => {
    try {
        const employee = await EmployeesService.createEmployee(req.body);
        return ApiResponse.success(res, employee, 201);
    } catch (error) {
        next(error);
    }
};

export const updateEmployee = async (req, res, next) => {
    try {
        const employee = await EmployeesService.updateEmployee(req.params.id, req.body);
        return ApiResponse.success(res, employee);
    } catch (error) {
        next(error);
    }
};

export const deleteEmployee = async (req, res, next) => {
    try {
        await EmployeesService.deleteEmployee(req.params.id);
        return ApiResponse.success(res, { message: 'Employee deleted successfully' });
    } catch (error) {
        next(error);
    }
};
