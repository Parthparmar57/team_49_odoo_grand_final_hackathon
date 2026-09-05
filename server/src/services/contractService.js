import { ContractStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

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

        // Overlapping active contract check
        if (data.status === ContractStatus.ACTIVE || !data.status) {
            const startDate = new Date(data.startDate);
            const endDate = data.endDate ? new Date(data.endDate) : null;

            const overlapping = await prisma.contract.findFirst({
                where: {
                    employeeId: data.employeeId,
                    status: ContractStatus.ACTIVE,
                    startDate: endDate ? { lte: endDate } : undefined,
                    OR: [
                        { endDate: null },
                        { endDate: { gte: startDate } },
                    ],
                },
            });

            if (overlapping) {
                throw new AppError(
                    `Overlapping active contract '${overlapping.contractRef}' already exists for this employee`,
                    400,
                    'OVERLAPPING_CONTRACT'
                );
            }
        }

        const payload = { ...data };
        if (payload.startDate && typeof payload.startDate === 'string') {
            payload.startDate = new Date(payload.startDate);
        }
        if (payload.endDate && typeof payload.endDate === 'string') {
            payload.endDate = new Date(payload.endDate);
        }

        return prisma.contract.create({
            data: payload,
            include: { employee: true, department: true, schedule: true, salaryStructure: true },
        });
    }

    static async updateContract(id, data) {
        await this.getContractById(id);

        const payload = { ...data };
        if (payload.startDate && typeof payload.startDate === 'string') {
            payload.startDate = new Date(payload.startDate);
        }
        if (payload.endDate && typeof payload.endDate === 'string') {
            payload.endDate = new Date(payload.endDate);
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
