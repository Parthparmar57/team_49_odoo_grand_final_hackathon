import { ContractsService } from './contracts.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getContracts = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.params.employeeId) {
            query.employeeId = req.params.employeeId;
        }
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const contracts = await ContractsService.getContracts(query);
        return ApiResponse.success(res, contracts);
    } catch (error) {
        next(error);
    }
};

export const getContractById = async (req, res, next) => {
    try {
        const contract = await ContractsService.getContractById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && contract.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to contract record', 'FORBIDDEN', 403);
        }
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
        const contract = await ContractsService.createContract(data);
        return ApiResponse.success(res, contract, 201);
    } catch (error) {
        next(error);
    }
};

export const updateContract = async (req, res, next) => {
    try {
        const contract = await ContractsService.updateContract(req.params.id, req.body);
        return ApiResponse.success(res, contract);
    } catch (error) {
        next(error);
    }
};

export const deleteContract = async (req, res, next) => {
    try {
        await ContractsService.deleteContract(req.params.id);
        return ApiResponse.success(res, { message: 'Contract deleted successfully' });
    } catch (error) {
        next(error);
    }
};
