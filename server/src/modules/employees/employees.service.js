import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { Validator } from '../../utils/validation.js';

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
        if (params.employmentType) where.employmentType = params.employmentType;

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    department: true,
                    manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                    schedule: true,
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
                schedule: true,
                attendances: { take: 30, orderBy: { date: 'desc' } },
                leaveRequests: { take: 10, orderBy: { startDate: 'desc' } },
                leaveAllocations: { include: { leaveType: true } },
                payslips: { take: 12, orderBy: { createdAt: 'desc' } },
            },
        });

        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        return employee;
    }

    static async createEmployee(data) {
        Validator.validateEmployeePayload(data);
        const { email, employeeNumber, departmentId } = data;

        let deptId = departmentId;
        if (!deptId) {
            const defaultDept = await prisma.department.findFirst();
            if (!defaultDept) {
                const createdDept = await prisma.department.create({
                    data: { name: 'General', code: 'GEN', description: 'General Department' }
                });
                deptId = createdDept.id;
            } else {
                deptId = defaultDept.id;
            }
        }

        const existing = await prisma.employee.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { employeeNumber: data.employeeNumber }
                ],
            },
        });

        if (existing) {
            throw new AppError('Employee with this email or employee number already exists', 400, 'EMPLOYEE_EXISTS');
        }

        const payload = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            employeeNumber: data.employeeNumber,
            designation: data.designation,
            joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
            employmentType: data.employmentType || 'FULL_TIME',
            status: data.status || 'ACTIVE',
            departmentId: deptId,
            scheduleId: data.scheduleId || null,
            managerId: data.managerId || null,
            bankName: data.bankName || null,
            accountNumber: data.accountNumber || null,
            ifscCode: data.ifscCode || null,
            taxId: data.taxId || null,
            address: data.address || null,
            emergencyContact: data.emergencyContact || null,
        };

        return prisma.employee.create({
            data: payload,
            include: { department: true, schedule: true, manager: true },
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

        const payload = { ...data };
        if (payload.joiningDate) {
            payload.joiningDate = new Date(payload.joiningDate);
        }
        if (payload.managerId === '') payload.managerId = null;
        if (payload.scheduleId === '') payload.scheduleId = null;
        if (payload.departmentId === '') delete payload.departmentId;

        return prisma.employee.update({
            where: { id },
            data: payload,
            include: { department: true, schedule: true, manager: true },
        });
    }

    static async deleteEmployee(id) {
        await this.getEmployeeById(id);
        return prisma.employee.delete({ where: { id } });
    }
}
