export class ApiResponse {
    static success(res, data, statusCode = 200, pagination = null) {
        const response = {
            success: true,
            data,
        };
        if (pagination) {
            response.pagination = pagination;
        }
        return res.status(statusCode).json(response);
    }

    static error(res, message, errorCode = 'INTERNAL_ERROR', statusCode = 500, details = null) {
        const response = {
            success: false,
            error: {
                code: errorCode,
                message,
            },
        };
        if (details) {
            response.error.details = details;
        }
        return res.status(statusCode).json(response);
    }
}
