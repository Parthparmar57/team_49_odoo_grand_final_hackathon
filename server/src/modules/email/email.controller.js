import { EmailService } from './email.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const handleInboundEmail = async (req, res, next) => {
    try {
        const result = await EmailService.processInboundEmail(req.body);
        return ApiResponse.success(res, result, 201);
    } catch (error) {
        next(error);
    }
};

export const getEmailLogs = async (req, res, next) => {
    try {
        const result = await EmailService.getLogs(req.query);
        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

