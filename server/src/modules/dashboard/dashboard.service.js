import { prisma } from '../../config/prisma.js';

export class DashboardService {
    static async getOverview(queryFilters = {}) {
        const { period = 'CURRENT_MONTH', periodStart, periodEnd, departmentId, employeeType } = queryFilters;

        // 1. Resolve date range filters
        const now = new Date();
        let startDate, endDate;

        if (periodStart && periodEnd) {
            startDate = new Date(periodStart);
            endDate = new Date(periodEnd);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'PREVIOUS_MONTH') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (period === 'CURRENT_YEAR') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else {
            // Default: CURRENT_MONTH
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // 2. Build employee filter clause
        const employeeWhere = {};
        if (departmentId) {
            employeeWhere.departmentId = departmentId;
        }
        if (employeeType) {
            employeeWhere.employmentType = employeeType;
        }

        // 3. Build payslip filter clause
        const payslipWhere = {
            periodStart: { gte: startDate },
            periodEnd: { lte: endDate },
        };
        if (Object.keys(employeeWhere).length > 0) {
            payslipWhere.employee = employeeWhere;
        }

        // 4. Parallel database queries
        const [
            totalEmployees,
            activeEmployees,
            totalDepartments,
            activeContracts,
            pendingLeaveRequests,
            paidSalaryAgg,
            payslipsGenerated,
            avgPayslipAgg,
            avgContractWageAgg,
            approvedTimeOffCount,
            attendanceCounts,
            departmentsList,
            allPayslipsInPeriod,
        ] = await Promise.all([
            prisma.employee.count({ where: employeeWhere }),
            prisma.employee.count({ where: { ...employeeWhere, status: 'ACTIVE' } }),
            prisma.department.count(),
            prisma.contract.count({
                where: {
                    status: 'ACTIVE',
                    ...(Object.keys(employeeWhere).length > 0 ? { employee: employeeWhere } : {}),
                },
            }),
            prisma.leaveRequest.count({
                where: {
                    status: 'PENDING',
                    ...(Object.keys(employeeWhere).length > 0 ? { employee: employeeWhere } : {}),
                },
            }),
            prisma.payslip.aggregate({
                _sum: { netSalary: true },
                where: {
                    ...payslipWhere,
                    payrun: { status: 'PAID' },
                },
            }),
            prisma.payslip.count({ where: payslipWhere }),
            prisma.payslip.aggregate({
                _avg: { netSalary: true },
                where: payslipWhere,
            }),
            prisma.contract.aggregate({
                _avg: { wage: true },
                where: {
                    status: 'ACTIVE',
                    ...(Object.keys(employeeWhere).length > 0 ? { employee: employeeWhere } : {}),
                },
            }),
            prisma.leaveRequest.count({
                where: {
                    status: 'APPROVED',
                    startDate: { lte: endDate },
                    endDate: { gte: startDate },
                    ...(Object.keys(employeeWhere).length > 0 ? { employee: employeeWhere } : {}),
                },
            }),
            prisma.attendance.groupBy({
                by: ['status'],
                _count: true,
                where: {
                    date: { gte: startDate, lte: endDate },
                    ...(Object.keys(employeeWhere).length > 0 ? { employee: employeeWhere } : {}),
                },
            }),
            prisma.department.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
            prisma.payslip.findMany({
                where: payslipWhere,
                select: {
                    netSalary: true,
                    periodStart: true,
                    employee: { select: { departmentId: true, department: { select: { name: true } } } },
                },
            }),
        ]);

        // 5. Calculate Attendance Health percentage
        const attendanceMap = attendanceCounts.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {});
        const positiveAttendance = (attendanceMap['PRESENT'] || 0) + (attendanceMap['HALF_DAY'] || 0) + (attendanceMap['OVERTIME'] || 0);
        const totalAttendanceLogs = Object.values(attendanceMap).reduce((a, b) => a + b, 0);
        const attendanceHealth = totalAttendanceLogs > 0 ? Math.round((positiveAttendance / totalAttendanceLogs) * 100) : 98;

        // 6. Calculate Average Salary
        const totalNetSalaryPaid = paidSalaryAgg._sum.netSalary || 0;
        const averageSalary = Math.round(avgPayslipAgg._avg.netSalary || avgContractWageAgg._avg.wage || 0);

        // 7. Department Salary Breakdown
        const deptCostMap = {};
        allPayslipsInPeriod.forEach((ps) => {
            const deptName = ps.employee?.department?.name || 'Unassigned';
            deptCostMap[deptName] = (deptCostMap[deptName] || 0) + Number(ps.netSalary || 0);
        });

        const departmentSalaryCost = departmentsList.map((d) => ({
            departmentId: d.id,
            departmentName: d.name,
            salaryCost: deptCostMap[d.name] || 0,
        }));

        // Include unassigned if any
        if (deptCostMap['Unassigned']) {
            departmentSalaryCost.push({
                departmentId: 'unassigned',
                departmentName: 'Unassigned',
                salaryCost: deptCostMap['Unassigned'],
            });
        }

        // 8. Monthly Net Salary Trend (Last 6 Months)
        const monthlyTrendMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrendMap[key] = 0;
        }

        allPayslipsInPeriod.forEach((ps) => {
            if (ps.periodStart) {
                const d = new Date(ps.periodStart);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyTrendMap[key] !== undefined) {
                    monthlyTrendMap[key] += Number(ps.netSalary || 0);
                }
            }
        });

        const monthlyNetSalaryTrend = Object.entries(monthlyTrendMap).map(([month, netSalary]) => ({
            month,
            netSalary,
        }));

        return {
            metrics: {
                totalEmployees,
                activeEmployees,
                totalDepartments,
                activeContracts,
                pendingLeaveRequests,
                totalNetSalaryPaid,
                payslipsGenerated,
                averageSalary,
                approvedTimeOff: approvedTimeOffCount,
                attendanceHealth,
            },
            departmentSalaryCost,
            monthlyNetSalaryTrend,
            filtersApplied: {
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                departmentId: departmentId || null,
                employeeType: employeeType || null,
            },
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

