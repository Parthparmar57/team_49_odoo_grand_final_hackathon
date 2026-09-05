import { prisma } from '../../config/prisma.js';

export class DashboardService {
    static async getOverview() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalEmployees,
            activeEmployees,
            totalDepartments,
            activeContracts,
            pendingLeaveRequests,
            monthPayruns,
            recentAttendance,
            pendingLeaves,
            onLeaveToday,
        ] = await Promise.all([
            prisma.employee.count(),
            prisma.employee.count({ where: { status: 'ACTIVE' } }),
            prisma.department.count(),
            prisma.contract.count({ where: { status: 'ACTIVE' } }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.payrun.count({
                where: {
                    createdAt: {
                        gte: new Date(today.getFullYear(), today.getMonth(), 1),
                        lte: new Date(today.getFullYear(), today.getMonth() + 1, 0),
                    },
                },
            }),
            prisma.attendance.findMany({
                take: 10,
                orderBy: { date: 'desc' },
                include: {
                    employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
                },
            }),
            prisma.leaveRequest.findMany({
                where: { status: 'PENDING' },
                take: 5,
                orderBy: { submittedAt: 'desc' },
                include: {
                    employee: { select: { id: true, firstName: true, lastName: true } },
                    leaveType: { select: { name: true } },
                },
            }),
            prisma.leaveRequest.count({
                where: {
                    status: 'APPROVED',
                    startDate: { lte: today },
                    endDate: { gte: today },
                },
            }),
        ]);

        return {
            totalEmployees,
            activeEmployees,
            totalDepartments,
            activeContracts,
            pendingLeaveRequests,
            monthPayruns,
            recentAttendance,
            pendingLeaves,
            onLeaveToday,
        };
    }

    static async getPayrollMetrics() {
        const [latestPayrun, totalNetPaid, totalPayslipsGenerated, avgSalaryAgg] = await Promise.all([
            prisma.payrun.findFirst({ orderBy: { periodStart: 'desc' }, include: { _count: { select: { payslips: true } } } }),
            prisma.payrun.aggregate({ _sum: { totalNet: true }, where: { status: 'PAID' } }),
            prisma.payslip.count(),
            prisma.contract.aggregate({ _avg: { wage: true }, where: { status: 'ACTIVE' } }),
        ]);

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
                    payslipCount: latestPayrun._count.payslips,
                }
                : null,
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
        const [pendingRequests, approvedRequests, refusedRequests] = await Promise.all([
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.leaveRequest.count({ where: { status: 'APPROVED' } }),
            prisma.leaveRequest.count({ where: { status: 'REFUSED' } }),
        ]);

        return {
            pendingRequests,
            approvedRequests,
            refusedRequests,
        };
    }
}
