import { PayrunStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ContractsService } from '../contracts/contracts.service.js';
import { AppError } from '../../middleware/error.middleware.js';

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
        } catch (e) {
            console.error('AuditLog error:', e.message);
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

    static async getPayruns(params = {}) {
        const where = {};
        if (params.status) where.status = params.status;

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
                payslips: {
                    include: {
                        employee: selectEmp(),
                        contract: true,
                        lines: { orderBy: { sequence: 'asc' } },
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

        if (payrun.status === PayrunStatus.VALIDATED) {
            throw new AppError('Cannot recompute a VALIDATED payrun directly', 400, 'INVALID_STATE');
        }

        // Clear previous calculations & warnings
        await tx.payrollWarning.deleteMany({ where: { payrunId } });
        await tx.payslipLine.deleteMany({ where: { payslip: { payrunId } } });
        await tx.payslip.deleteMany({ where: { payrunId } });

        const employees = await tx.employee.findMany({
            where: { status: 'ACTIVE' },
            include: { schedule: true },
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
                    ruleValues[rule.code] = amount;

                    if (rule.category === 'BASIC') basic += amount;
                    if (rule.category === 'ALLOWANCE') totalAllowances += amount;
                    if (rule.category === 'DEDUCTION') totalDeductionsEmp += amount;

                    lines.push({
                        code: rule.code,
                        name: rule.name,
                        category: rule.category,
                        sequence: rule.sequence,
                        sequence: rule.sequence,
                        amount,
                    });

                    if (rule.category === 'BASIC') categoryTotals.BASIC += amount;
                    else if (rule.category === 'ALLOWANCE') categoryTotals.ALLOWANCE += amount;
                    else if (rule.category === 'DEDUCTION') categoryTotals.DEDUCTION += amount;
                }

                gross = basic + totalAllowances;
                net = gross - totalDeductionsEmp;

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
            throw new AppError(`Payrun must be in COMPUTED state before validation (Current state: ${payrun.status})`, 400, 'INVALID_STATE');
        }

        const blockingWarnings = payrun.warnings.filter((w) => w.severity === PayrollWarningSeverity.BLOCKING && !w.resolved);
        if (blockingWarnings.length > 0) {
            throw new AppError(`Cannot validate payrun with ${blockingWarnings.length} unresolved blocking warnings`, 400, 'BLOCKING_WARNINGS_EXIST');
        }

        if (payrun.payslips.length === 0) {
            throw new AppError('Cannot validate payrun with no generated payslips', 400, 'NO_PAYSLIPS_GENERATED');
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
                employee: selectEmp(),
                contract: true,
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
