import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../middleware/error.middleware.js';

export class AuthService {
    static async register(data) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: data.role,
                ...(data.employeeNumber && {
                    employee: {
                        create: {
                            employeeNumber: data.employeeNumber,
                            firstName: data.firstName || 'First',
                            lastName: data.lastName || 'Last',
                            email: data.email,
                            designation: data.designation || 'Staff',
                            joiningDate: new Date(),
                            ...(data.departmentId && { departmentId: data.departmentId }),
                        },
                    },
                }),
            },
            include: { employee: true },
        });

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        });

        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { employee: true },
        });

        if (!user) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        const isValid = await bcrypt.compare(data.password, user.password);
        if (!isValid) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        });

        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static async getUserProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                employee: {
                    include: {
                        department: true,
                        workingSchedule: true,
                        contracts: { orderBy: { startDate: 'desc' } },
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async forgotPassword({ email }) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // For security, return success even if user not found to avoid user enumeration
            return { message: 'If an account exists with this email, reset instructions have been sent.' };
        }

        // Generate reset token (in production, saved with expiration in DB or Redis)
        const resetToken = signToken({ id: user.id, email: user.email, type: 'reset_password' }, '1h');
        
        // Log reset link for development/demo
        console.log(`[AUTH] Password reset link for ${email}: /auth/reset-password/${resetToken}`);

        return {
            message: 'Password reset link sent to your work email address.',
            resetToken, // Returned in dev mode for easy testing/demo
        };
    }

    static async resetPassword({ token, password }) {
        let decoded;
        try {
            const { verifyToken } = await import('../../utils/jwt.js');
            decoded = verifyToken(token);
        } catch (err) {
            throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
        }

        if (!decoded || !decoded.id) {
            throw new AppError('Invalid token payload', 400, 'INVALID_TOKEN');
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

        return { message: 'Password has been reset successfully.' };
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

        const { passwordHash, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tempPassword: rawPassword,
            message: 'User created successfully.'
        };
    }

    static async getUsers() {
        const users = await prisma.user.findMany({
            include: {
                employee: {
                    include: { department: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return users.map(user => {
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
}

