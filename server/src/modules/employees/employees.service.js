import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class EmployeesService {
    static async getEmployees(params = {}) {
        const page = parseInt(params.page || '1', 10);
        const limit = parseInt(params.limit || '10', 10);
        const skip = (page - 1) * limit;

        const where = {};
        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { employeeNumber: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        if (params.departmentId) where.departmentId = params.departmentId;
        if (params.status) where.status = params.status;

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    department: true,
                    manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                    workingSchedule: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.employee.count({ where }),
        ]);

        return {
            employees,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async getEmployeeById(id) {
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, role: true } },
                department: true,
                manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                subordinates: { select: { id: true, firstName: true, lastName: true, designation: true } },
                contracts: { orderBy: { startDate: 'desc' } },
                workingSchedule: true,
                attendance: { take: 30, orderBy: { date: 'desc' } },
                leaveRequests: { take: 10, orderBy: { startDate: 'desc' } },
                payslips: { take: 12, orderBy: { createdAt: 'desc' } },
            },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        return employee;
    }

    static async createEmployee(data) {
        const existing = await prisma.employee.findFirst({
            where: {
                OR: [{ email: data.email }, { employeeNumber: data.employeeNumber }],
            },
        });

        if (existing) {
            throw new AppError('Employee with this email or employee number already exists', 400, 'EMPLOYEE_EXISTS');
        }

        return prisma.employee.create({
            data,
            include: { department: true, workingSchedule: true },
        });
    }

    static async updateEmployee(id, data) {
        await this.getEmployeeById(id);

        if (data.email || data.employeeNumber) {
            const existing = await prisma.employee.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(data.email ? [{ email: data.email }] : []),
                        ...(data.employeeNumber ? [{ employeeNumber: data.employeeNumber }] : []),
                    ],
                },
            });

            if (existing) {
                throw new AppError('Employee with this email or employee number already exists', 400, 'EMPLOYEE_EXISTS');
            }
        }

        return prisma.employee.update({
            where: { id },
            data,
            include: { department: true, workingSchedule: true },
        });
    }

    static async deleteEmployee(id) {
        await this.getEmployeeById(id);
        return prisma.employee.delete({ where: { id } });
    }
}
