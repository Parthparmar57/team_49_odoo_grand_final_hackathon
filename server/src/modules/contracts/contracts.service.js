import { ContractStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class ContractsService {
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
        const {
            contractRef,
            employeeId,
            wage,
            startDate,
            endDate,
            status = 'ACTIVE',
            departmentId,
            scheduleId,
            salaryStructureId,
            notes,
        } = data;

        if (!contractRef || !employeeId || !wage || !startDate) {
            throw new AppError('Missing required contract fields (reference, employee, wage, start date)', 400, 'VALIDATION_ERROR');
        }

        const existingRef = await prisma.contract.findUnique({ where: { contractRef } });
        if (existingRef) {
            throw new AppError(`Contract reference number '${contractRef}' already exists`, 400, 'CONTRACT_REF_EXISTS');
        }

        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new AppError('Specified employee does not exist', 404, 'EMPLOYEE_NOT_FOUND');
        }

        let deptId = departmentId || employee.departmentId;
        if (!deptId) {
            const defaultDept = await prisma.department.findFirst();
            deptId = defaultDept?.id;
        }

        if (!deptId) {
            const createdDept = await prisma.department.create({
                data: { name: 'General', code: 'GEN', description: 'General Department' }
            });
            deptId = createdDept.id;
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = endDate ? new Date(endDate) : null;

        if (isNaN(parsedStartDate.getTime())) {
            throw new AppError('Invalid start date format', 400, 'INVALID_DATE');
        }

        if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
            throw new AppError('Invalid end date format', 400, 'INVALID_DATE');
        }

        if (parsedEndDate && parsedEndDate < parsedStartDate) {
            throw new AppError('End date cannot be earlier than start date', 400, 'INVALID_DATE_RANGE');
        }

        // Auto-expire previous active contract(s) for this employee to prevent overlapping active contracts
        if (status === ContractStatus.ACTIVE || status === 'ACTIVE') {
            const existingActiveContracts = await prisma.contract.findMany({
                where: {
                    employeeId,
                    status: ContractStatus.ACTIVE,
                },
            });

            const dayBeforeNewStart = new Date(parsedStartDate.getTime() - 86400000);

            for (const oldContract of existingActiveContracts) {
                await prisma.contract.update({
                    where: { id: oldContract.id },
                    data: {
                        status: ContractStatus.EXPIRED,
                        endDate: oldContract.endDate && oldContract.endDate < dayBeforeNewStart ? oldContract.endDate : dayBeforeNewStart,
                    },
                });
            }
        }

        const payload = {
            contractRef,
            employeeId,
            departmentId: deptId,
            scheduleId: scheduleId || null,
            salaryStructureId: salaryStructureId || null,
            wage: parseFloat(wage),
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            status: status || ContractStatus.ACTIVE,
            notes: notes || null,
        };

        return prisma.contract.create({
            data: payload,
            include: { employee: true, department: true, schedule: true, salaryStructure: true },
        });
    }

    static async updateContract(id, data) {
        const currentContract = await this.getContractById(id);

        const payload = { ...data };
        if (payload.startDate) payload.startDate = new Date(payload.startDate);
        if (payload.endDate !== undefined) {
            payload.endDate = payload.endDate ? new Date(payload.endDate) : null;
        }
        if (payload.wage) payload.wage = parseFloat(payload.wage);
        if (payload.scheduleId === '') payload.scheduleId = null;
        if (payload.salaryStructureId === '') payload.salaryStructureId = null;
        if (payload.departmentId === '') delete payload.departmentId;

        // Auto-expire other active contracts if updating status to ACTIVE
        if (payload.status === ContractStatus.ACTIVE || payload.status === 'ACTIVE') {
            const startDate = payload.startDate || currentContract.startDate;
            const dayBeforeStart = new Date(new Date(startDate).getTime() - 86400000);

            const otherActiveContracts = await prisma.contract.findMany({
                where: {
                    employeeId: currentContract.employeeId,
                    status: ContractStatus.ACTIVE,
                    id: { not: id },
                },
            });

            for (const oldContract of otherActiveContracts) {
                await prisma.contract.update({
                    where: { id: oldContract.id },
                    data: {
                        status: ContractStatus.EXPIRED,
                        endDate: oldContract.endDate && oldContract.endDate < dayBeforeStart ? oldContract.endDate : dayBeforeStart,
                    },
                });
            }
        }

        return prisma.contract.update({
            where: { id },
            data: payload,
            include: { employee: true, department: true, schedule: true, salaryStructure: true },
        });
    }

    static async deleteContract(id) {
        await this.getContractById(id);
        return prisma.contract.delete({ where: { id } });
    }
}
