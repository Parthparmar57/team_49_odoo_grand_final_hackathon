import { logger } from '../utils/logger.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (err instanceof AppError || err.name === 'AppError' || err.isOperational) {
        return ApiResponse.error(res, err.message, err.code || 'BAD_REQUEST', err.statusCode || 400, err.details);
    }

    // Zod Validation Error
    if (err.name === 'ZodError') {
        return ApiResponse.error(res, 'Validation Error', 'VALIDATION_ERROR', 400, err.errors);
    }

    // Prisma Error Handling
    if (err.code === 'P2002') {
        return ApiResponse.error(
            res,
            `Unique constraint violation on field: ${err.meta?.target}`,
            'DUPLICATE_ENTRY',
            400
        );
    }

    if (err.code === 'P2003') {
        return ApiResponse.error(res, 'Foreign key constraint failed: referenced entity does not exist', 'FOREIGN_KEY_VIOLATION', 400);
    }

    if (err.code === 'P2025') {
        return ApiResponse.error(res, 'Record not found in database', 'NOT_FOUND', 404);
    }

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    return ApiResponse.error(res, message, code, statusCode);
};

export const notFoundHandler = (req, res) => {
    return ApiResponse.error(res, `Cannot ${req.method} ${req.path}`, 'NOT_FOUND', 404);
};
