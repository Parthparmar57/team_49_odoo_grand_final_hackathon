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
}
