import { ApiResponse } from '../utils/responseFormatter.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}

export function errorHandler(err, req, res, next) {
    logger.error(`${req.method} ${req.path} - ${err.message}`, err.stack);

    if (err instanceof AppError) {
        return ApiResponse.error(res, err.message, err.code, err.statusCode);
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        if (err.code === 'P2002') {
            return ApiResponse.error(res, 'A record with this unique value already exists.', 'DUPLICATE_RECORD', 400);
        }
        if (err.code === 'P2025') {
            return ApiResponse.error(res, 'Requested record not found.', 'NOT_FOUND', 404);
        }
    }

    return ApiResponse.error(
        res,
        process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message,
        'INTERNAL_SERVER_ERROR',
        500
    );
}

export function notFoundHandler(req, res) {
    return ApiResponse.error(res, `Route ${req.method} ${req.path} not found`, 'NOT_FOUND', 404);
}
