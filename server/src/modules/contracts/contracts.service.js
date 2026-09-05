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
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        const existingRef = await prisma.contract.findUnique({ where: { contractRef: cleanedData.contractRef } });
        if (existingRef) {
            throw new AppError('Contract reference number already exists', 400, 'CONTRACT_REF_EXISTS');
        }

        if (cleanedData.status === ContractStatus.ACTIVE || !cleanedData.status) {
            const startDate = new Date(cleanedData.startDate);
            const endDate = cleanedData.endDate ? new Date(cleanedData.endDate) : null;

            const whereClause = {
                employeeId: cleanedData.employeeId,
                status: ContractStatus.ACTIVE,
                OR: [{ endDate: null }, { endDate: { gte: startDate } }],
            };
            if (endDate) {
                whereClause.startDate = { lte: endDate };
            }

            const overlapping = await prisma.contract.findFirst({ where: whereClause });

            if (overlapping) {
                throw new AppError(
                    `Overlapping active contract '${overlapping.contractRef}' already exists for this employee`,
                    400,
                    'OVERLAPPING_CONTRACT'
                );
            }
        }

        return prisma.contract.create({
            data: cleanedData,
            include: { employee: true, department: true, schedule: true, salaryStructure: true },
        });
    }

    static async updateContract(id, data) {
        await this.getContractById(id);

        return prisma.contract.update({
            where: { id },
            data,
            include: { employee: true, department: true, schedule: true, salaryStructure: true },
        });
    }

    static async deleteContract(id) {
        await this.getContractById(id);
        return prisma.contract.delete({ where: { id } });
    }
}
