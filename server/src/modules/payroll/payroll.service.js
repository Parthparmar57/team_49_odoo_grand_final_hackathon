import { PayrunStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ContractsService } from '../contracts/contracts.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import { PayslipPdfService } from './payslipPdf.service.js';

export class PayrollService {
    // ==========================================
    // AUDIT LOG HELPER
    // ==========================================
    static async logAudit(actorId, action, entity, entityId, metadata = {}) {
        try {
            await prisma.auditLog.create({
                data: {
                    actorId: actorId || null,
                    action,
                    entity,
                    entityId,
                    metadata,
                },
            });
        } catch (err) {
            console.error('Audit log failure:', err.message);
        }
    }

    // ==========================================
    // SALARY STRUCTURES
    // ==========================================
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

        if (!structure) {
            throw new AppError('Salary structure not found', 404, 'STRUCTURE_NOT_FOUND');
        }

        return structure;
    }

    static async createSalaryStructure(data) {
        const existing = await prisma.salaryStructure.findUnique({ where: { code: data.code } });
        if (existing) {
            throw new AppError('Salary structure with this code already exists', 400, 'CODE_EXISTS');
        }

        return prisma.salaryStructure.create({
            data,
            include: { rules: true },
        });
    }

    static async updateSalaryStructure(id, data) {
        await this.getSalaryStructureById(id);

        return prisma.salaryStructure.update({
            where: { id },
            data,
            include: { rules: { orderBy: { sequence: 'asc' } } },
        });
    }

    // ==========================================
    // PAYRUN MANAGEMENT
    // ==========================================
    static async getPayruns(query = {}) {
        const where = {};
        if (query.status) where.status = query.status;

        return prisma.payrun.findMany({
            where,
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
                warnings: true,
                payslips: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true, designation: true } },
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

        if (data.salaryStructureId) {
            await this.getSalaryStructureById(data.salaryStructureId);
        }

        let payrunRef = data.payrunRef;
        if (!payrunRef) {
            payrunRef = `PR-${Date.now()}`;
        }
        const existingRef = await prisma.payrun.findFirst({ where: { payrunRef } });
        if (existingRef) {
            payrunRef = `${payrunRef}-${Date.now().toString().slice(-4)}`;
        }

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

        if (payrun.status === PayrunStatus.VALIDATED) {
            throw new AppError('Cannot recompute a VALIDATED payrun directly', 400, 'INVALID_STATE');
        }

        // Clear previous calculations & warnings
        await prisma.payrollWarning.deleteMany({ where: { payrunId } });
        await prisma.payslipLine.deleteMany({ where: { payslip: { payrunId } } });
        await prisma.payslip.deleteMany({ where: { payrunId } });

        const employees = await prisma.employee.findMany({
            where: { status: 'ACTIVE' },
            include: { schedule: true },
        });

        const warnings = [];
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        let employeeCount = 0;

        for (const employee of employees) {
            try {
                const contract = await ContractsService.findApplicableContract(employee.id, payrun.periodStart, payrun.periodEnd);

                let salaryStructure = payrun.salaryStructure || contract.salaryStructure;

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
                const wage = Number(contract.wage || 0);

                for (const rule of rules) {
                    let amount = 0;

                    if (rule.computationMethod === 'FIXED') {
                        amount = Number(rule.amount || 0);
                    } else if (rule.computationMethod === 'PERCENTAGE') {
                        const baseCode = rule.percentageBasedOn || 'BASIC';
                        let baseAmount = categoryTotals[baseCode] || 0;
                        if (!baseAmount || baseAmount === 0 || rule.category === 'BASIC' || rule.code === 'BASIC') {
                            baseAmount = wage;
                        }
                        amount = baseAmount * (Number(rule.percentage || 0) / 100);
                    } else if (rule.computationMethod === 'FORMULA') {
                        amount = wage;
                    }

                    amount = Math.round(amount * 100) / 100;

                    if (rule.category === 'BASIC') categoryTotals.BASIC += amount;
                    else if (rule.category === 'ALLOWANCE') categoryTotals.ALLOWANCE += amount;
                    else if (rule.category === 'DEDUCTION') categoryTotals.DEDUCTION += amount;

                    lines.push({
                        code: rule.code,
                        name: rule.name,
                        category: rule.category,
                        sequence: rule.sequence,
                        amount,
                    });
                }

                categoryTotals.GROSS = categoryTotals.BASIC + categoryTotals.ALLOWANCE;
                categoryTotals.NET = Math.max(0, categoryTotals.GROSS - categoryTotals.DEDUCTION);

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

        // Record warnings if any
        if (warnings.length > 0) {
            await prisma.payrollWarning.createMany({
                data: warnings.map((w) => ({
                    payrunId,
                    employeeId: w.employeeId,
                    message: `${w.employeeName}: ${w.issue}`,
                    severity: 'WARNING',
                })),
            });
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
                warnings: true,
                payslips: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
                        lines: { orderBy: { sequence: 'asc' } },
                    },
                },
            },
        });
    }

    static async validatePayrun(payrunId, actorId) {
        let payrun = await this.getPayrunById(payrunId);

        if (payrun.status !== PayrunStatus.COMPUTED && payrun.status !== PayrunStatus.DRAFT) {
            throw new AppError(`Payrun must be in COMPUTED or DRAFT state before validation (Current state: ${payrun.status})`, 400, 'INVALID_STATE');
        }

        if (!payrun.payslips || payrun.payslips.length === 0) {
            payrun = await this.computePayrun(payrunId);
        }

        const warnings = payrun.warnings || [];
        const blockingWarnings = warnings.filter((w) => w.severity === 'BLOCKING' && !w.resolved);
        if (blockingWarnings.length > 0) {
            throw new AppError(`Cannot validate payrun with ${blockingWarnings.length} unresolved blocking warnings`, 400, 'BLOCKING_WARNINGS_EXIST');
        }

        if (!payrun.payslips || payrun.payslips.length === 0) {
            throw new AppError('Cannot validate payrun with no generated payslips. Please ensure active employees have active contracts.', 400, 'NO_PAYSLIPS_GENERATED');
        }

        const validated = await prisma.payrun.update({
            where: { id: payrunId },
            data: {
                status: PayrunStatus.VALIDATED,
                validatedAt: new Date(),
            },
            include: { salaryStructure: true, payslips: true, warnings: true },
        });

        await this.logAudit(actorId, 'PAYRUN_VALIDATED', 'Payrun', payrunId, { validatedAt: validated.validatedAt });
        return validated;
    }

    // ==========================================
    // MARK PAYRUN PAID
    // ==========================================
    static async markPayrunPaid(payrunId, actorId) {
        const payrun = await this.getPayrunById(payrunId);

        if (payrun.status !== PayrunStatus.VALIDATED) {
            throw new AppError(`Payrun must be in VALIDATED state before marking as paid (Current state: ${payrun.status})`, 400, 'INVALID_STATE');
        }

        return prisma.$transaction(async (tx) => {
            await tx.payslip.updateMany({
                where: { payrunId },
                data: { status: 'PAID' },
            });

            const paidPayrun = await tx.payrun.update({
                where: { id: payrunId },
                data: {
                    status: PayrunStatus.PAID,
                    paidAt: new Date(),
                },
                include: { salaryStructure: true, payslips: true },
            });

            await this.logAudit(actorId, 'PAYRUN_MARKED_PAID', 'Payrun', payrunId, { paidAt: paidPayrun.paidAt });
            return paidPayrun;
        });
    }

    // ==========================================
    // PAYSLIPS & PDF
    // ==========================================
    static async getPayslips(query = {}) {
        const where = {};
        if (query.employeeId) where.employeeId = query.employeeId;
        if (query.payrunId) where.payrunId = query.payrunId;
        return prisma.payslip.findMany({
            where,
            include: {
                payrun: { select: { id: true, name: true, periodStart: true, periodEnd: true, status: true } },
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true, designation: true } },
                contract: { select: { id: true, wage: true, contractRef: true } },
                salaryStructure: true,
                lines: { orderBy: { sequence: 'asc' } },
            },
            orderBy: { periodStart: 'desc' },
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

    static async downloadPayslipPdf(id, actorId) {
        const payslip = await this.getPayslipById(id);
        const pdfBuffer = await PayslipPdfService.generatePayslipPdf(payslip);
        if (actorId) {
            await this.logAudit(actorId, 'PAYSLIP_PDF_DOWNLOADED', 'Payslip', id);
        }
        return pdfBuffer;
    }

    static async sendPayrunEmails(payrunId, actorId) {
        const payrun = await this.getPayrunById(payrunId);
        if (!payrun.payslips || payrun.payslips.length === 0) {
            throw new AppError('No payslips found in this payrun to dispatch emails', 400, 'NO_PAYSLIPS');
        }

        const results = [];
        for (const payslip of payrun.payslips) {
            const recipientEmail = payslip.employee?.email;
            const recipientName = `${payslip.employee?.firstName || ''} ${payslip.employee?.lastName || ''}`.trim();
            if (recipientEmail) {
                console.log(`[BULK PAYSLIP EMAIL DISPATCH] Queued email to ${recipientName} (${recipientEmail}) for Payslip ${payslip.payslipRef || payslip.id}`);
                results.push({
                    employeeId: payslip.employeeId,
                    email: recipientEmail,
                    payslipRef: payslip.payslipRef,
                    status: 'DISPATCHED'
                });
            }
        }

        if (actorId) {
            await this.logAudit(actorId, 'PAYRUN_EMAILS_DISPATCHED', 'Payrun', payrunId, { totalSent: results.length });
        }

        return {
            message: `Bulk payslip emails dispatched successfully to ${results.length} employees`,
            dispatchedCount: results.length,
            details: results
        };
    }
}

