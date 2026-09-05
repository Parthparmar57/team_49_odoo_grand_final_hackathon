import { AuthService } from '../services/authService.js';
import { EmployeeService } from '../services/employeeService.js';
import { ContractService } from '../services/contractService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

export const register = async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return ApiResponse.success(res, result.user, 201);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return ApiResponse.success(res, result.user, 200);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    res.clearCookie('token');
    return ApiResponse.success(res, { message: 'Logged out successfully' });
};

export const getMe = async (req, res, next) => {
    try {
        const profile = await AuthService.getUserProfile(req.user.id);
        return ApiResponse.success(res, profile);
    } catch (error) {
        next(error);
    }
};

export const getEmployees = async (req, res, next) => {
    try {
        const result = await EmployeeService.getEmployees(req.query);
        return ApiResponse.success(res, result.employees, 200, result.pagination);
    } catch (error) {
        next(error);
    }
};

export const getEmployeeById = async (req, res, next) => {
    try {
        // If EMPLOYEE role, check own employeeId permission
        if (req.user.role === 'EMPLOYEE' && req.user.employeeId !== req.params.id) {
            return ApiResponse.error(res, 'Unauthorized access to employee record', 'FORBIDDEN', 403);
        }
        const employee = await EmployeeService.getEmployeeById(req.params.id);
        return ApiResponse.success(res, employee);
    } catch (error) {
        next(error);
    }
};

export const createEmployee = async (req, res, next) => {
    try {
        const employee = await EmployeeService.createEmployee(req.body);
        return ApiResponse.success(res, employee, 201);
    } catch (error) {
        next(error);
    }
};

export const updateEmployee = async (req, res, next) => {
    try {
        const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
        return ApiResponse.success(res, employee);
    } catch (error) {
        next(error);
    }
};

export const deleteEmployee = async (req, res, next) => {
    try {
        await EmployeeService.deleteEmployee(req.params.id);
        return ApiResponse.success(res, { message: 'Employee deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getContracts = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.params.employeeId) {
            query.employeeId = req.params.employeeId;
        }
        const contracts = await ContractService.getContracts(query);
        return ApiResponse.success(res, contracts);
    } catch (error) {
        next(error);
    }
};

export const getContractById = async (req, res, next) => {
    try {
        const contract = await ContractService.getContractById(req.params.id);
        return ApiResponse.success(res, contract);
    } catch (error) {
        next(error);
    }
};

export const createContract = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.params.employeeId) {
            data.employeeId = req.params.employeeId;
        }
        const contract = await ContractService.createContract(data);
        return ApiResponse.success(res, contract, 201);
    } catch (error) {
        next(error);
    }
};

export const updateContract = async (req, res, next) => {
    try {
        const contract = await ContractService.updateContract(req.params.id, req.body);
        return ApiResponse.success(res, contract);
    } catch (error) {
        next(error);
    }
};

export const deleteContract = async (req, res, next) => {
    try {
        await ContractService.deleteContract(req.params.id);
        return ApiResponse.success(res, { message: 'Contract deleted successfully' });
    } catch (error) {
        next(error);
    }
};
