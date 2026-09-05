import { LeaveStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class TimeOffService {
    static async calculateWorkingDays(employeeId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { workingSchedule: true },
        });

        const schedule = employee?.workingSchedule || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
        };

        const dayMap = { 0: schedule.sunday, 1: schedule.monday, 2: schedule.tuesday, 3: schedule.wednesday, 4: schedule.thursday, 5: schedule.friday, 6: schedule.saturday };

        let workingDays = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayMap[dayOfWeek]) {
                workingDays++;
            }
            current.setDate(current.getDate() + 1);
        }

        return workingDays;
    }

    static async getTimeOffTypes() {
        return prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    }

    static async getTimeOffAllocations(employeeId) {
        return prisma.leaveAllocation.findMany({
            where: { employeeId },
            include: { leaveType: true },
        });
    }

    static async getTimeOffRequests(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.status) where.status = params.status;

        return prisma.leaveRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                leaveType: true,
                reviewedBy: { select: { id: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async createTimeOffRequest(data) {
        const { employeeId, leaveTypeId, startDate, endDate, reason } = data;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
        }

        // Overlap check
        const overlapping = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
                startDate: { lte: end },
                endDate: { gte: start },
            },
        });

        if (overlapping) {
            throw new AppError('An overlapping leave request already exists for this period', 400, 'OVERLAPPING_LEAVE');
        }

        const numberOfDays = await this.calculateWorkingDays(employeeId, start, end);

        // Allocation check
        const allocation = await prisma.leaveAllocation.findFirst({
            where: { employeeId, leaveTypeId },
        });

        if (allocation) {
            const remainingDays = allocation.allocatedDays - allocation.usedDays;
            if (numberOfDays > remainingDays) {
                throw new AppError(`Insufficient leave balance. Requested: ${numberOfDays} days, Available: ${remainingDays} days`, 400, 'INSUFFICIENT_LEAVE_BALANCE');
            }
        }

        return prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveTypeId,
                startDate: start,
                endDate: end,
                numberOfDays,
                reason,
                status: LeaveStatus.PENDING,
            },
            include: { leaveType: true, employee: true },
        });
    }

    static async approveTimeOffRequest(requestId, reviewerUserId) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.findUnique({
                where: { id: requestId },
                include: { leaveType: true },
            });

            if (!request) {
                throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
            }

            if (request.status !== LeaveStatus.PENDING) {
                throw new AppError(`Cannot approve leave request in status ${request.status}`, 400, 'INVALID_STATE_TRANSITION');
            }

            // Deduct allocation atomically
            const allocation = await tx.leaveAllocation.findFirst({
                where: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId },
            });

            if (allocation) {
                await tx.leaveAllocation.update({
                    where: { id: allocation.id },
                    data: { usedDays: { increment: request.numberOfDays } },
                });
            }

            const updated = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: LeaveStatus.APPROVED,
                    reviewedById: reviewerUserId,
                    reviewedAt: new Date(),
                },
                include: { leaveType: true, employee: true },
            });

            await tx.auditLog.create({
                data: {
                    action: 'LEAVE_APPROVAL',
                    entity: 'LeaveRequest',
                    entityId: requestId,
                    actorId: reviewerUserId,
                    oldValue: { status: request.status },
                    newValue: { status: LeaveStatus.APPROVED },
                },
            });

            return updated;
        });
    }

    static async refuseTimeOffRequest(requestId, reviewerUserId, rejectionReason) {
        const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
        }

        if (request.status !== LeaveStatus.PENDING) {
            throw new AppError(`Cannot refuse leave request in status ${request.status}`, 400, 'INVALID_STATE_TRANSITION');
        }

        const updated = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: LeaveStatus.REJECTED,
                reviewedById: reviewerUserId,
                reviewedAt: new Date(),
                rejectionReason,
            },
            include: { leaveType: true, employee: true },
        });

        await prisma.auditLog.create({
            data: {
                action: 'LEAVE_REJECTION',
                entity: 'LeaveRequest',
                entityId: requestId,
                actorId: reviewerUserId,
                oldValue: { status: request.status },
                newValue: { status: LeaveStatus.REJECTED, rejectionReason },
            },
        });

        return updated;
    }
}
