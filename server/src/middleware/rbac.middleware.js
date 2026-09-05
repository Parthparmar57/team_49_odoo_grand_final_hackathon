import { ApiResponse } from '../utils/apiResponse.js';

export const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.error(res, 'Unauthenticated', 'UNAUTHORIZED', 401);
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return ApiResponse.error(
                res,
                `User role ${req.user.role} is not authorized to access this resource`,
                'FORBIDDEN',
                403
            );
        }

        next();
    };
};
