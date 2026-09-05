import bcrypt from 'bcryptjs';
import { Role, ContractStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

export class AuthService {
    static async register(data) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const role = data.role || Role.EMPLOYEE;

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                role,
            },
        });

        let employee = null;
        if (data.employeeNumber && data.firstName && data.lastName && data.departmentId && data.designation) {
            employee = await prisma.employee.create({
                data: {
                    employeeNumber: data.employeeNumber,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    designation: data.designation,
                    joiningDate: new Date(),
                    userId: user.id,
                    departmentId: data.departmentId,
                },
            });
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: employee?.id,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employeeId: employee?.id,
            },
            token,
        };
    }

    static async login(data) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { employee: { select: { id: true } } },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        const isMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            employeeId: user.employee?.id,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employeeId: user.employee?.id,
            },
            token,
        };
    }

    static async getUserProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                employee: {
                    include: {
                        department: true,
                        schedule: true,
                        manager: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
        }

        return user;
    }
}

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

export class ContractService {
    static async getContracts(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.status) where.status = params.status;

        return prisma.contract.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                department: true,
                schedule: true,
                salaryStructure: true,
            },
            orderBy: { startDate: 'desc' },
        });
    }

    static async getContractById(id) {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                employee: true,
                department: true,
                schedule: true,
                salaryStructure: { include: { rules: { orderBy: { sequence: 'asc' } } } },
            },
        });

        if (!contract) {
            throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
        }

        return contract;
    }

    static async findApplicableContract(employeeId, periodStart, periodEnd) {
        const contracts = await prisma.contract.findMany({
            where: {
                employeeId,
                status: ContractStatus.ACTIVE,
                startDate: { lte: periodEnd },
                OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
            },
            include: {
                employee: true,
                department: true,
                schedule: true,
                salaryStructure: { include: { rules: { where: { active: true }, orderBy: { sequence: 'asc' } } } },
            },
        });

        if (contracts.length === 0) {
            throw new AppError(
                `No active contract found for employee ID ${employeeId} applicable to period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
                400,
                'MISSING_CONTRACT'
            );
        }

        if (contracts.length > 1) {
            throw new AppError(
                `Multiple overlapping active contracts found for employee ID ${employeeId} in period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
                400,
                'AMBIGUOUS_CONTRACT'
            );
        }

        return contracts[0];
    }

    static async createContract(data) {
        const existingRef = await prisma.contract.findUnique({ where: { contractRef: data.contractRef } });
        if (existingRef) {
            throw new AppError('Contract reference number already exists', 400, 'CONTRACT_REF_EXISTS');
        }

        return prisma.contract.create({
            data,
            include: { employee: true, department: true, salaryStructure: true },
        });
    }

    static async updateContract(id, data) {
        await this.getContractById(id);
        return prisma.contract.update({
            where: { id },
            data,
            include: { employee: true, department: true, salaryStructure: true },
        });
    }

    static async deleteContract(id) {
        await this.getContractById(id);
        return prisma.contract.delete({ where: { id } });
    }
}
