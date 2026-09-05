import { verifyToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { prisma } from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
    try {
        let token = null;
        let tokenSource = null;

        // 1. Priority 1: Authorization Header
        if (req.headers.authorization) {
            if (req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
                tokenSource = 'header';
            } else {
                return ApiResponse.error(res, 'Invalid authorization header format', 'UNAUTHORIZED', 401);
            }
        }

        // 2. Priority 2: Cookie (only if Authorization header was not provided)
        if (!token && req.cookies?.token) {
            token = req.cookies.token;
            tokenSource = 'cookie';
        }

        if (!token) {
            return ApiResponse.error(res, 'Authentication token required', 'UNAUTHORIZED', 401);
        }

        // 3. Verify JWT token
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            // If Bearer token was explicitly provided but invalid, return 401 immediately without fallback to cookie
            return ApiResponse.error(res, 'Invalid or expired authentication token', 'UNAUTHORIZED', 401);
        }

        if (!decoded || !decoded.id) {
            return ApiResponse.error(res, 'Invalid authentication token payload', 'UNAUTHORIZED', 401);
        }

        // 4. Query PostgreSQL for fresh user & employee data (DB is source of truth for role/employeeId)
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                employee: {
                    include: {
                        department: true,
                        schedule: true,
                        contracts: { orderBy: { startDate: 'desc' } },
                    },
                },
            },
        });

        if (!user) {
            return ApiResponse.error(res, 'User account no longer exists', 'UNAUTHORIZED', 401);
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id || null,
            employee: user.employee || null,
        };

        next();
    } catch (error) {
        return ApiResponse.error(res, 'Authentication failed', 'UNAUTHORIZED', 401);
    }
};

