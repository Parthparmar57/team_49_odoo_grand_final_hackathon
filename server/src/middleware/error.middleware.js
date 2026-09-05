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
        const targets = err.meta?.target || [];
        const fieldName = Array.isArray(targets) ? targets.join(', ') : 'field';
        return ApiResponse.error(
            res,
            `A record with this ${fieldName} already exists in the system.`,
            'DUPLICATE_ENTRY',
            400
        );
    }

    if (err.code === 'P2003') {
        return ApiResponse.error(res, 'Foreign key violation: referenced relation (department or schedule) does not exist.', 'FOREIGN_KEY_VIOLATION', 400);
    }

    if (err.code === 'P2025') {
        return ApiResponse.error(res, 'Requested record was not found in database.', 'NOT_FOUND', 404);
    }

    if (err.code === 'P2000') {
        return ApiResponse.error(res, 'Provided field value is too long for database constraints.', 'VALUE_TOO_LONG', 400);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    return ApiResponse.error(res, message, code, statusCode, err.details);
};

export const notFoundHandler = (req, res) => {
    return ApiResponse.error(res, `Cannot ${req.method} ${req.path}`, 'NOT_FOUND', 404);
};
