import { PayrunStatus, ContractStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ContractsService } from '../contracts/contracts.service.js';
import { PayslipPdfService } from './payslipPdf.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export class PayrollService {
    static async getSalaryStructures() {
        return prisma.salaryStructure.findMany({
            include: { rules: { orderBy: { sequence: 'asc' } } },
            orderBy: { name: 'asc' },
        });
    }

    static async createPayrun(data) {
        const periodStart = new Date(data.periodStart);
        const periodEnd = new Date(data.periodEnd);

        if (periodEnd < periodStart) {
            throw new AppError('Period end date cannot be before period start date', 400, 'INVALID_PERIOD');
        }

        const payrun = await prisma.payrun.create({
            data: {
                name: data.name || `Payrun ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
                periodStart,
                periodEnd,
                status: PayrunStatus.DRAFT,
            },
        });

        return this.computePayrun(payrun.id);
    }

    static async getPayruns() {
        return prisma.payrun.findMany({
            include: {
                _count: { select: { payslips: true } },
            },
            orderBy: { periodStart: 'desc' },
        });
    }

    static async getPayrunById(id) {
        const payrun = await prisma.payrun.findUnique({
            where: { id },
            include: {
                payslips: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                        contract: true,
                        lines: true,
                    },
                },
            },
        });

        if (!payrun) {
            throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');
        }

        return payrun;
    }

    static async computePayrun(payrunId) {
        const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
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
        let totalDeduction = 0;
        let totalNet = 0;

        await prisma.payslipLine.deleteMany({ where: { payslip: { payrunId } } });
        await prisma.payslip.deleteMany({ where: { payrunId } });

        for (const employee of employees) {
            try {
                const contract = await ContractsService.findApplicableContract(employee.id, payrun.periodStart, payrun.periodEnd);
                const salaryStructure = contract.salaryStructure;

                if (!salaryStructure) {
                    warnings.push({ employeeId: employee.id, employeeName: `${employee.firstName} ${employee.lastName}`, issue: 'Missing salary structure on contract' });
                    continue;
                }

                const lines = [];
                const categoryTotals = { BASIC: 0, ALLOWANCE: 0, GROSS: 0, DEDUCTION: 0, NET: 0 };
                const wage = Number(contract.wage);

                for (const rule of salaryStructure.rules) {
                    let amount = 0;

                    if (rule.amountType === 'FIXED') {
                        amount = Number(rule.fixedAmount || 0);
                    } else if (rule.amountType === 'PERCENTAGE') {
                        const baseAmount = categoryTotals[rule.percentageBase || 'BASIC'] || wage;
                        amount = baseAmount * (Number(rule.percentage || 0) / 100);
                    } else if (rule.amountType === 'FORMULA') {
                        amount = wage;
                    }

                    amount = Math.round(amount * 100) / 100;
                    lines.push({
                        code: rule.code,
                        name: rule.name,
                        category: rule.category,
                        amount,
                    });

                    if (rule.category === 'BASIC') categoryTotals.BASIC += amount;
                    if (rule.category === 'ALLOWANCE') categoryTotals.ALLOWANCE += amount;
                    if (rule.category === 'DEDUCTION') categoryTotals.DEDUCTION += amount;
                }

                categoryTotals.GROSS = categoryTotals.BASIC + categoryTotals.ALLOWANCE;
                categoryTotals.NET = categoryTotals.GROSS - categoryTotals.DEDUCTION;

                const payslipNumber = `PS-${payrunId.slice(-4)}-${employee.employeeNumber}`;

                const payslip = await prisma.payslip.create({
                    data: {
                        payslipNumber,
                        employeeId: employee.id,
                        contractId: contract.id,
                        structureId: salaryStructure.id,
                        payrunId: payrun.id,
                        periodStart: payrun.periodStart,
                        periodEnd: payrun.periodEnd,
                        basicSalary: categoryTotals.BASIC,
                        grossSalary: categoryTotals.GROSS,
                        totalDeduction: categoryTotals.DEDUCTION,
                        netSalary: categoryTotals.NET,
                        status: 'COMPUTED',
                        lines: {
                            create: lines,
                        },
                    },
                });

                totalGross += categoryTotals.GROSS;
                totalDeduction += categoryTotals.DEDUCTION;
                totalNet += categoryTotals.NET;
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
                totalDeduction,
                totalNet,
                warnings: warnings.length > 0 ? warnings : null,
            },
            include: {
                payslips: { include: { employee: true, lines: true } },
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
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                contract: true,
                structure: true,
                lines: true,
            },
        });

        if (!payslip) {
            throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
        }

        return payslip;
    }

    static async downloadPayslipPdf(id) {
        const payslip = await this.getPayslipById(id);
        return PayslipPdfService.generatePayslipPdf(payslip);
    }
}
