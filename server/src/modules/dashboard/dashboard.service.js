import { prisma } from '../../config/prisma.js';

export class DashboardService {
    static async getOverview() {
        const [totalEmployees, activeEmployees, totalDepartments, activeContracts, pendingLeaves] = await Promise.all([
            prisma.employee.count(),
            prisma.employee.count({ where: { status: 'ACTIVE' } }),
            prisma.department.count(),
            prisma.contract.count({ where: { status: 'ACTIVE' } }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        ]);

        return {
            totalEmployees,
            activeEmployees,
            totalDepartments,
            activeContracts,
            pendingLeaves,
        };
    }

    static async getPayrollMetrics() {
        const [latestPayrun, totalNetPaid, totalPayslipsGenerated, avgSalaryAgg] = await Promise.all([
            prisma.payrun.findFirst({ orderBy: { periodStart: 'desc' }, include: { _count: { select: { payslips: true } } } }),
            prisma.payrun.aggregate({ _sum: { totalNet: true }, where: { status: 'PAID' } }),
            prisma.payslip.count(),
            prisma.contract.aggregate({ _avg: { wage: true }, where: { status: 'ACTIVE' } }),
        ]);

        const warnings = latestPayrun?.warnings || [];

        return {
            totalNetSalaryPaid: totalNetPaid._sum.totalNet || 0,
            payslipsGenerated: totalPayslipsGenerated,
            averageContractWage: avgSalaryAgg._avg.wage || 0,
            latestPayrun: latestPayrun
                ? {
                    id: latestPayrun.id,
                    name: latestPayrun.name,
                    status: latestPayrun.status,
                    totalNet: latestPayrun.totalNet,
                    warningsCount: Array.isArray(warnings) ? warnings.length : 0,
                }
                : null,
            payrollWarnings: warnings,
        };
    }

    static async getAttendanceMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayPresent, todayHalfDay, todayOvertime, totalActive] = await Promise.all([
            prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
            prisma.attendance.count({ where: { date: today, status: 'HALF_DAY' } }),
            prisma.attendance.count({ where: { date: today, status: 'OVERTIME' } }),
            prisma.employee.count({ where: { status: 'ACTIVE' } }),
        ]);

        const totalTodayAttendance = todayPresent + todayHalfDay + todayOvertime;
        const attendancePercentage = totalActive > 0 ? Math.round((totalTodayAttendance / totalActive) * 100) : 0;

        return {
            todayPresent,
            todayHalfDay,
            todayOvertime,
            totalActiveEmployees: totalActive,
            attendancePercentage,
        };
    }

    static async getTimeOffMetrics() {
        const [pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.leaveRequest.count({ where: { status: 'APPROVED' } }),
            prisma.leaveRequest.count({ where: { status: 'REJECTED' } }),
        ]);

        return {
            pendingRequests,
            approvedRequests,
            rejectedRequests,
        };
    }
}
