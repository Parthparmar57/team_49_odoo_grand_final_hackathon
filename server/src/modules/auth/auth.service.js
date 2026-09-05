import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/error.middleware.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

export function buildAuthUserResponse(user) {
    if (!user) return null;
    const { passwordHash, ...userWithoutPassword } = user;
    return {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        employeeId: userWithoutPassword.employee?.id || null,
        employee: userWithoutPassword.employee || null,
        createdAt: userWithoutPassword.createdAt,
        updatedAt: userWithoutPassword.updatedAt,
    };
}

export class AuthService {
    static async register(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                role: data.role || 'EMPLOYEE',
            },
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

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        });

        return { user: buildAuthUserResponse(user), token };
    }

    static async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
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
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        const isValid = await bcrypt.compare(data.password, user.passwordHash);
        if (!isValid) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        });

        return { user: buildAuthUserResponse(user), token };
    }

    static async getUserProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return buildAuthUserResponse(user);
    }

    static async forgotPassword({ email }) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: true },
        });

        if (!user) {
            // For security, return generic success to avoid user enumeration
            return { message: 'If an account exists with this email, reset instructions have been sent via Brevo.' };
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Sign JWT reset token with verification code payload (valid for 1 hour)
        const resetToken = signToken({
            id: user.id,
            email: user.email,
            verificationCode,
            type: 'reset_password',
        }, '1h');

        const recipientName = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;

        // Send email via Brevo
        const emailResult = await sendPasswordResetEmail({
            recipientEmail: user.email,
            recipientName,
            resetToken,
            verificationCode,
        });

        return {
            message: 'Email verification code & password reset link sent via Brevo to your work email.',
            resetToken,
            verificationCode,
            emailDelivery: emailResult,
        };
    }

    static async resetPassword({ token, verificationCode, password }) {
        let decoded;
        try {
            const { verifyToken } = await import('../../utils/jwt.js');
            decoded = verifyToken(token);
        } catch (err) {
            throw new AppError('Invalid or expired password reset token', 400, 'INVALID_TOKEN');
        }

        if (!decoded || !decoded.id) {
            throw new AppError('Invalid token payload', 400, 'INVALID_TOKEN');
        }

        // Validate 6-digit verification code if provided
        if (verificationCode && decoded.verificationCode) {
            if (verificationCode.trim() !== decoded.verificationCode.trim()) {
                throw new AppError('Invalid 6-digit email verification code', 400, 'INVALID_VERIFICATION_CODE');
            }
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
        });

        return { message: 'Password has been verified and updated successfully.' };
    }

    static async adminCreateUser(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new AppError('A user with this email already exists', 400, 'USER_EXISTS');
        }

        const rawPassword = data.password || 'Welcome@123';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        let employeeId = data.employeeId;

        // If no employee ID provided, check if employee with matching email exists or create one
        if (!employeeId) {
            const existingEmployee = await prisma.employee.findUnique({ where: { email: data.email } });
            if (existingEmployee) {
                employeeId = existingEmployee.id;
            } else {
                // Find or use default department
                const dept = await prisma.department.findFirst();
                let deptId = dept?.id;
                if (!deptId) {
                    const newDept = await prisma.department.create({
                        data: { name: 'General', code: 'GEN', description: 'General Department' }
                    });
                    deptId = newDept.id;
                }

                const newEmp = await prisma.employee.create({
                    data: {
                        employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        designation: data.role === 'ADMIN' ? 'System Administrator' : 'Team Member',
                        joiningDate: new Date(),
                        departmentId: deptId,
                    }
                });
                employeeId = newEmp.id;
            }
        }

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                role: data.role,
                ...(employeeId && { employee: { connect: { id: employeeId } } }),
            },
            include: {
                employee: {
                    include: { department: true }
                }
            }
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        return {
            user: buildAuthUserResponse(user),
            tempPassword: rawPassword,
            message: 'User created successfully.'
        };
    }

    static async getUsers(queryParams = {}) {
        const page = Math.max(1, parseInt(queryParams.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit) || 10));
        const skip = (page - 1) * limit;

        const { search, role } = queryParams;

        const where = {};

        if (role && role !== 'ALL') {
            where.role = role;
        }

        if (search && search.trim()) {
            const query = search.trim();
            where.OR = [
                { email: { contains: query, mode: 'insensitive' } },
                {
                    employee: {
                        OR: [
                            { firstName: { contains: query, mode: 'insensitive' } },
                            { lastName: { contains: query, mode: 'insensitive' } },
                            { designation: { contains: query, mode: 'insensitive' } },
                        ]
                    }
                }
            ];
        }

        const [totalUsers, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employee: {
                        include: { department: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const formattedUsers = users.map(user => buildAuthUserResponse(user));

        const totalPages = Math.ceil(totalUsers / limit) || 1;

        return {
            users: formattedUsers,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        };
    }
}

