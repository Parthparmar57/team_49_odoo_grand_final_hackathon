import { verifyToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/responseFormatter.js';
import { prisma } from '../config/prisma.js';

export async function authenticate(req, res, next) {
    try {
        let token = req.cookies?.token;

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return ApiResponse.error(res, 'Authentication token missing', 'UNAUTHORIZED', 401);
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return ApiResponse.error(res, 'Invalid or expired authentication token', 'UNAUTHORIZED', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                role: true,
                employee: { select: { id: true } },
            },
        });

        if (!user) {
            return ApiResponse.error(res, 'User no longer exists', 'UNAUTHORIZED', 401);
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        };

        next();
    } catch (error) {
        return ApiResponse.error(res, 'Authentication failed', 'UNAUTHORIZED', 401);
    }
}
