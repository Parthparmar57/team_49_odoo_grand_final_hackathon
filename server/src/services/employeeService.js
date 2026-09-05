import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class EmployeeService {
    static async getEmployees(params = {}) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where = {};
        if (params.departmentId) where.departmentId = params.departmentId;
        if (params.status) where.status = params.status;
        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { employeeNumber: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    department: true,
                    schedule: true,
                    manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.employee.count({ where }),
        ]);

        return {
            employees,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    static async getEmployeeById(id) {
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                department: true,
                schedule: true,
                manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                user: { select: { id: true, email: true, role: true } },
                contracts: { orderBy: { startDate: 'desc' } },
                leaveAllocations: { include: { leaveType: true } },
                leaveRequests: { take: 5, orderBy: { submittedAt: 'desc' }, include: { leaveType: true } },
                payslips: { take: 5, orderBy: { periodEnd: 'desc' } },
                _count: {
                    select: { contracts: true, attendances: true, leaveRequests: true, leaveAllocations: true, payslips: true },
                },
            },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        return employee;
    }

    static async createEmployee(data) {
        const existingEmp = await prisma.employee.findFirst({
            where: { OR: [{ email: data.email }, { employeeNumber: data.employeeNumber }] },
        });
        if (existingEmp) {
            throw new AppError('Employee with this email or employee number already exists', 400, 'EMPLOYEE_EXISTS');
        }
        return prisma.employee.create({ data, include: { department: true, schedule: true } });
    }

    static async updateEmployee(id, data) {
        await this.getEmployeeById(id);
        return prisma.employee.update({ where: { id }, data, include: { department: true, schedule: true } });
    }

    static async deleteEmployee(id) {
        await this.getEmployeeById(id);
        return prisma.employee.delete({ where: { id } });
    }
}
