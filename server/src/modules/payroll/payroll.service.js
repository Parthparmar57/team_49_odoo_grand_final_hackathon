import { PayrunStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ContractsService } from '../contracts/contracts.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export class PayrollService {
    static async getSalaryStructures() {
        return prisma.salaryStructure.findMany({
            include: { rules: { orderBy: { sequence: 'asc' } } },
            orderBy: { name: 'asc' },
        });
    }

    static async getSalaryStructureById(id) {
        const structure = await prisma.salaryStructure.findUnique({
            where: { id },
            include: { rules: { orderBy: { sequence: 'asc' } } },
        });
        if (!structure) throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
        return structure;
    }

    static async createSalaryStructure(data) {
        const existing = await prisma.salaryStructure.findFirst({
            where: { OR: [{ name: data.name }, { code: data.code }] },
        });
        if (existing) throw new AppError('Salary structure with this name or code already exists', 400, 'STRUCTURE_EXISTS');
        return prisma.salaryStructure.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                rules: data.rules ? { create: data.rules } : undefined,
            },
            include: { rules: { orderBy: { sequence: 'asc' } } },
        });
    }

    static async updateSalaryStructure(id, data) {
        await this.getSalaryStructureById(id);
        return prisma.salaryStructure.update({
            where: { id },
            data: { name: data.name, code: data.code, description: data.description, active: data.active },
            include: { rules: { orderBy: { sequence: 'asc' } } },
        });
    }

    static async getPayruns() {
        return prisma.payrun.findMany({
            include: {
                salaryStructure: true,
                _count: { select: { payslips: true } },
            },
            orderBy: { periodStart: 'desc' },
        });
    }

    static async getPayrunById(id) {
        const payrun = await prisma.payrun.findUnique({
            where: { id },
            include: {
                salaryStructure: true,
                payslips: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                        contract: true,
                        lines: { orderBy: { sequence: 'asc' } },
                    },
                },
            },
        });

        if (!payrun) {
            throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
        }

        return payrun;
    }

    static async createPayrun(data) {
        const periodStart = new Date(data.periodStart);
        const periodEnd = new Date(data.periodEnd);

        if (periodEnd < periodStart) {
            throw new AppError('Period end date cannot be before period start date', 400, 'INVALID_PERIOD');
        }

        // Validate salary structure exists
        if (data.salaryStructureId) {
            await this.getSalaryStructureById(data.salaryStructureId);
        }

        const payrunRef = data.payrunRef || `PR-${Date.now()}`;
        const existingRef = await prisma.payrun.findFirst({ where: { payrunRef } });
        if (existingRef) throw new AppError('Payrun reference already exists', 400, 'PAYRUN_REF_EXISTS');

        const payrun = await prisma.payrun.create({
            data: {
                payrunRef,
                name: data.name || `Payrun ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
                salaryStructureId: data.salaryStructureId,
                periodStart,
                periodEnd,
                status: PayrunStatus.DRAFT,
            },
        });

        return this.computePayrun(payrun.id);
    }

    static async computePayrun(payrunId) {
        const payrun = await prisma.payrun.findUnique({
            where: { id: payrunId },
            include: { salaryStructure: { include: { rules: { where: { active: true }, orderBy: { sequence: 'asc' } } } } },
        });
        if (!payrun) {
            throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
        }

        if (payrun.status === PayrunStatus.PAID) {
            throw new AppError('Cannot recompute a PAID payrun', 400, 'PAYRUN_PAID');
        }

        const employees = await prisma.employee.findMany({
            where: { status: 'ACTIVE' },
            include: { department: true },
        });

        const warnings = [];
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        let employeeCount = 0;

        // Clean existing payslips for recompute
        await prisma.payslipLine.deleteMany({ where: { payslip: { payrunId } } });
        await prisma.payslip.deleteMany({ where: { payrunId } });

        for (const employee of employees) {
            try {
                const contract = await ContractsService.findApplicableContract(employee.id, payrun.periodStart, payrun.periodEnd);

                // Use payrun's salary structure if set, otherwise contract's
                let salaryStructure = payrun.salaryStructure;
                if (!salaryStructure) {
                    salaryStructure = contract.salaryStructure;
                }

                if (!salaryStructure) {
                    warnings.push({
                        employeeId: employee.id,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        issue: 'Missing salary structure on contract and payrun',
                    });
                    continue;
                }

                const rules = salaryStructure.rules || [];
                const lines = [];
                const categoryTotals = { BASIC: 0, ALLOWANCE: 0, GROSS: 0, DEDUCTION: 0, NET: 0 };
                const wage = Number(contract.wage);

                for (const rule of rules) {
                    let amount = 0;

                    if (rule.computationMethod === 'FIXED') {
                        amount = Number(rule.amount || 0);
                    } else if (rule.computationMethod === 'PERCENTAGE') {
                        const baseCode = rule.percentageBasedOn || 'BASIC';
                        const baseAmount = categoryTotals[baseCode] ?? wage;
                        amount = baseAmount * (Number(rule.percentage || 0) / 100);
                    } else if (rule.computationMethod === 'FORMULA') {
                        // Simple formula: treat as wage for now
                        amount = wage;
                    }

                    amount = Math.round(amount * 100) / 100;
                    lines.push({
                        code: rule.code,
                        name: rule.name,
                        category: rule.category,
                        sequence: rule.sequence,
                        amount,
                    });

                    if (rule.category === 'BASIC') categoryTotals.BASIC += amount;
                    else if (rule.category === 'ALLOWANCE') categoryTotals.ALLOWANCE += amount;
                    else if (rule.category === 'DEDUCTION') categoryTotals.DEDUCTION += amount;
                }

                categoryTotals.GROSS = categoryTotals.BASIC + categoryTotals.ALLOWANCE;
                categoryTotals.NET = categoryTotals.GROSS - categoryTotals.DEDUCTION;

                const payslipRef = `PS-${payrunId.slice(-6)}-${employee.employeeNumber}`;

                await prisma.payslip.create({
                    data: {
                        payslipRef,
                        employeeId: employee.id,
                        contractId: contract.id,
                        salaryStructureId: salaryStructure.id,
                        payrunId: payrun.id,
                        periodStart: payrun.periodStart,
                        periodEnd: payrun.periodEnd,
                        basicSalary: categoryTotals.BASIC,
                        grossSalary: categoryTotals.GROSS,
                        totalAllowances: categoryTotals.ALLOWANCE,
                        totalDeductions: categoryTotals.DEDUCTION,
                        netSalary: categoryTotals.NET,
                        status: 'COMPUTED',
                        lines: { create: lines },
                    },
                });

                totalGross += categoryTotals.GROSS;
                totalDeductions += categoryTotals.DEDUCTION;
                totalNet += categoryTotals.NET;
                employeeCount++;
            } catch (err) {
                warnings.push({
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    issue: err.message,
                });
            }
        }

        return prisma.payrun.update({
            where: { id: payrunId },
            data: {
                status: PayrunStatus.COMPUTED,
                totalGross,
                totalDeductions,
                totalNet,
                employeeCount,
            },
            include: {
                salaryStructure: true,
                payslips: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
                        lines: { orderBy: { sequence: 'asc' } },
                    },
                },
            },
        });
    }

    static async validatePayrun(payrunId) {
        const payrun = await this.getPayrunById(payrunId);
        if (payrun.status !== PayrunStatus.COMPUTED) {
            throw new AppError(`Payrun must be in COMPUTED state before validation (Current: ${payrun.status})`, 400, 'INVALID_STATE');
        }

        return prisma.payrun.update({
            where: { id: payrunId },
            data: { status: PayrunStatus.VALIDATED },
        });
    }

    static async markPayrunPaid(payrunId) {
        const payrun = await this.getPayrunById(payrunId);
        if (payrun.status !== PayrunStatus.VALIDATED) {
            throw new AppError(`Payrun must be in VALIDATED state before payment (Current: ${payrun.status})`, 400, 'INVALID_STATE');
        }

        await prisma.payslip.updateMany({
            where: { payrunId },
            data: { status: 'PAID' },
        });

        return prisma.payrun.update({
            where: { id: payrunId },
            data: { status: PayrunStatus.PAID },
        });
    }

    static async getPayslipById(id) {
        const payslip = await prisma.payslip.findUnique({
            where: { id },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true, department: true } },
                contract: true,
                salaryStructure: true,
                lines: { orderBy: { sequence: 'asc' } },
            },
        });

        if (!payslip) {
            throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
        }

        return payslip;
    }

    static async getPayslips(params = {}) {
        const where = {};
        if (params.payrunId) where.payrunId = params.payrunId;
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.status) where.status = params.status;

        return prisma.payslip.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                payrun: { select: { id: true, name: true, periodStart: true, periodEnd: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
