import { ApiResponse } from '../utils/responseFormatter.js';

export function authorize(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return ApiResponse.error(
                res,
                'Forbidden: Insufficient permissions for this action',
                'FORBIDDEN',
                403
            );
        }

        next();
    };
}

export function isSelfOrAuthorized(paramName = 'id', allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.error(res, 'Authentication required', 'UNAUTHORIZED', 401);
        }

        const targetId = req.params[paramName];
        const isSelf = req.user.id === targetId || req.user.employeeId === targetId;
        const isRoleAllowed = allowedRoles.includes(req.user.role);

        if (isSelf || isRoleAllowed) {
            return next();
        }

        return ApiResponse.error(
            res,
            'Forbidden: Cannot access resources belonging to other users',
            'FORBIDDEN',
            403
        );
    };
}
