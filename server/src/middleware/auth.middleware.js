import { verifyToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const authenticate = (req, res, next) => {
    try {
        let token = req.cookies?.token;

        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }
        }

        if (!token) {
            return ApiResponse.error(res, 'Authentication token required', 'UNAUTHORIZED', 401);
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return ApiResponse.error(res, 'Invalid or expired authentication token', 'UNAUTHORIZED', 401);
    }
};
