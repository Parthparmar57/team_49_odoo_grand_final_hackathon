/**
 * Leave Quota Service — Monthly free-leave enforcement + salary deduction.
 *
 * Business rule:
 *   - Every employee gets MONTHLY_FREE_LEAVES (3) paid leave days for free.
 *   - All leave types (PL, SL, UL) are counted together towards this quota.
 *   - If total approved leave in a calendar month exceeds 3 days, the excess
 *     days are deducted from salary at the employee daily rate.
 *
 * Daily Rate formula:
 *   dailyRate = monthlyWage / WORKING_DAYS_PER_MONTH  (default 26)
 *   deductionAmount = excessDays x dailyRate
 */
import { prisma } from '../../config/prisma.js';
import { LeaveRequestStatus } from '@prisma/client';

export const MONTHLY_FREE_LEAVES = 3;
export const WORKING_DAYS_PER_MONTH = 26;

/**
 * Total approved leave days for an employee in a given calendar month.
 * All leave types counted together.
 */
export async function getMonthlyLeaveUsed(employeeId, year, month) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 0);
    const approved = await prisma.leaveRequest.findMany({
        where: {
            employeeId,
            status: LeaveRequestStatus.APPROVED,
            startDate: { lte: periodEnd },
            endDate:   { gte: periodStart },
        },
        select: { duration: true },
    });
    return approved.reduce((sum, r) => sum + r.duration, 0);
}

/**
 * Calculates quota violation and deduction amount — does NOT write to DB.
 */
export async function checkQuota(employeeId, newDays, year, month) {
    const alreadyUsed = await getMonthlyLeaveUsed(employeeId, year, month);
    const totalAfter  = alreadyUsed + newDays;
    const excessDays  = Math.max(0, totalAfter - MONTHLY_FREE_LEAVES);
    const willDeduct  = excessDays > 0;

    let dailyRate = 0;
    if (willDeduct) {
        const contract = await prisma.contract.findFirst({
            where: { employeeId, status: 'ACTIVE' },
            orderBy: { startDate: 'desc' },
            select: { wage: true },
        });
        if (contract?.wage) {
            dailyRate = contract.wage / WORKING_DAYS_PER_MONTH;
        }
    }

    const deductionAmount = parseFloat((excessDays * dailyRate).toFixed(2));
    return {
        alreadyUsed, newDays, totalAfter,
        freeLeaves: MONTHLY_FREE_LEAVES,
        excessDays, willDeduct,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        deductionAmount,
    };
}

/**
 * Records deduction as PayrollWarning and updates payslip if in DRAFT/COMPUTED.
 */
export async function applyLeaveDeduction(employeeId, quotaResult, year, month, leaveRequestId) {
    if (!quotaResult.willDeduct || quotaResult.deductionAmount <= 0) {
        return { warningId: null, payslipUpdated: false, deductionAmount: 0 };
    }
    const { excessDays, deductionAmount, dailyRate } = quotaResult;
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd   = new Date(year, month, 0);

    const payrun = await prisma.payrun.findFirst({
        where: { periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } },
        orderBy: { createdAt: 'desc' },
    });

    let warningId = null;
    let payslipUpdated = false;

    if (payrun) {
        const warning = await prisma.payrollWarning.create({
            data: {
                payrunId:   payrun.id,
                employeeId,
                type:       'EXCESS_LEAVE_DEDUCTION',
                severity:   'WARNING',
                message:    `Exceeded monthly leave quota by ${excessDays} day(s). Deduction: Rs.${deductionAmount} (Rs.${dailyRate}/day x ${excessDays} days). Leave: ${leaveRequestId}`,
                resolved:   false,
            },
        });
        warningId = warning.id;

        const payslip = await prisma.payslip.findFirst({
            where: { payrunId: payrun.id, employeeId, status: { in: ['DRAFT', 'COMPUTED'] } },
        });
        if (payslip) {
            await prisma.payslip.update({
                where: { id: payslip.id },
                data: {
                    totalDeductions: { increment: deductionAmount },
                    netSalary:       { decrement: deductionAmount },
                    leaveDays:       { increment: excessDays },
                },
            });
            payslipUpdated = true;
        }
    }

    await prisma.auditLog.create({
        data: {
            action: 'LEAVE_DEDUCTION_APPLIED',
            entity: 'LeaveRequest',
            entityId: leaveRequestId,
            metadata: { employeeId, year, month, excessDays, deductionAmount, payrunId: payrun?.id || null, warningId },
        },
    });

    return { warningId, payslipUpdated, deductionAmount };
}

/**
 * Convenience: check quota then apply deduction in one call.
 * Used by timeOff.service.js approveLeaveRequest().
 */
export async function enforceQuotaOnApproval(employeeId, leaveRequestId, newDays, year, month) {
    const quotaResult = await checkQuota(employeeId, newDays, year, month);
    const deductionResult = await applyLeaveDeduction(employeeId, quotaResult, year, month, leaveRequestId);
    return { quota: quotaResult, deduction: deductionResult };
}
