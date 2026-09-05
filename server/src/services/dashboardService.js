import { LeaveRequestStatus, AttendanceStatus, PayrunStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class DashboardService {
    static async getSummary() {
        const [totalEmployees, activeContracts, pendingLeaves, paidPayruns, totalNetPaid] = await Promise.all([
            prisma.employee.count({ where: { status: 'ACTIVE' } }),
            prisma.contract.count({ where: { status: 'ACTIVE' } }),
            prisma.leaveRequest.count({ where: { status: LeaveRequestStatus.PENDING } }),
            prisma.payrun.count({ where: { status: PayrunStatus.PAID } }),
            prisma.payrun.aggregate({
                where: { status: PayrunStatus.PAID },
                _sum: { totalNet: true },
            }),
        ]);

        return {
            totalEmployees,
            activeContracts,
            pendingLeaves,
            paidPayruns,
            totalNetSalaryPaid: totalNetPaid._sum.totalNet || 0,
        };
    }

    static async getPayrollMetrics() {
        const departmentCosts = await prisma.employee.groupBy({
            by: ['departmentId'],
            _count: { id: true },
        });

        const depts = await prisma.department.findMany();
        const deptMap = new Map(depts.map((d) => [d.id, d.name]));

        const formattedDeptCosts = departmentCosts.map((d) => ({
            departmentId: d.departmentId,
            departmentName: deptMap.get(d.departmentId) || 'Unassigned',
            employeeCount: d._count.id,
        }));

        return {
            departmentBreakdown: formattedDeptCosts,
        };
    }

    static async getAttendanceHealth() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendances = await prisma.attendance.findMany({
            where: { date: { gte: today } },
        });

        const present = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
        const total = attendances.length || 1;

        return {
            todayRecords: total,
            presentCount: present,
            attendanceHealthPercentage: Math.round((present / total) * 100),
        };
    }

    static async getWarnings() {
        const missingBank = await prisma.employee.findMany({
            where: { status: 'ACTIVE', OR: [{ bankName: null }, { accountNumber: null }] },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        const missingContract = await prisma.employee.findMany({
            where: { status: 'ACTIVE', contracts: { none: { status: 'ACTIVE' } } },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        return {
            employeesMissingBankDetails: missingBank,
            employeesMissingActiveContract: missingContract,
        };
    }
}
