import { PayrunStatus, PayslipStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ContractService } from './contractService.js';
import { PayrollEngine } from './payrollEngine.js';
import { AppError } from '../middleware/errorHandler.js';

export class PayrunService {
    static async createPayrun(data) {
        const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = data;

        const payrun = await prisma.payrun.create({
            data: {
                name,
                salaryStructureId,
                periodStart,
                periodEnd,
                status: PayrunStatus.DRAFT,
            },
        });

        const warnings = [];

        for (const empId of employeeIds) {
            const employee = await prisma.employee.findUnique({ where: { id: empId } });
            if (!employee) continue;

            try {
                const contract = await ContractService.findApplicableContract(empId, periodStart, periodEnd);
                const empWarnings = PayrollEngine.validatePreRunWarnings(employee, contract);
                warnings.push(...empWarnings);

                const computed = PayrollEngine.computePayslipForContract(contract, periodStart, periodEnd);

                await prisma.payslip.create({
                    data: {
                        payrunId: payrun.id,
                        employeeId: empId,
                        contractId: contract.id,
                        periodStart,
                        periodEnd,
                        basicSalary: computed.basicSalary,
                        grossSalary: computed.grossSalary,
                        totalDeductions: computed.totalDeductions,
                        netSalary: computed.netSalary,
                        status: PayslipStatus.DRAFT,
                        lines: {
                            create: computed.lines.map((l) => ({
                                salaryRuleId: l.ruleId,
                                code: l.code,
                                name: l.name,
                                category: l.category,
                                amount: l.amount,
                                rate: l.rate,
                            })),
                        },
                    },
                });
            } catch (err) {
                warnings.push(`Employee #${empId}: ${err.message}`);
            }
        }

        // Aggregate totals
        const totals = await prisma.payslip.aggregate({
            where: { payrunId: payrun.id },
            _sum: { netSalary: true, grossSalary: true, totalDeductions: true },
            _count: { id: true },
        });

        const updatedPayrun = await prisma.payrun.update({
            where: { id: payrun.id },
            data: {
                totalEmployees: totals._count.id,
                totalGross: totals._sum.grossSalary || 0,
                totalDeductions: totals._sum.totalDeductions || 0,
                totalNet: totals._sum.netSalary || 0,
            },
            include: { payslips: { include: { employee: true, lines: true } } },
        });

        return { payrun: updatedPayrun, warnings };
    }

    static async validatePayrun(payrunId) {
        const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
        if (!payrun) throw new AppError('Payrun not found', 404, 'PAYRUN_NOT_FOUND');

        return prisma.$transaction(async (tx) => {
            await tx.payslip.updateMany({
                where: { payrunId },
                data: { status: PayslipStatus.VERIFIED },
            });

            return tx.payrun.update({
                where: { id: payrunId },
                data: { status: PayrunStatus.VERIFIED },
                include: { payslips: true },
            });
        });
    }

    static async markPaid(payrunId) {
        return prisma.$transaction(async (tx) => {
            await tx.payslip.updateMany({
                where: { payrunId },
                data: { status: PayslipStatus.PAID },
            });

            return tx.payrun.update({
                where: { id: payrunId },
                data: { status: PayrunStatus.PAID, paidAt: new Date() },
                include: { payslips: true },
            });
        });
    }
}
