import { LeaveRequestStatus, LeaveSource } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class LeaveService {
    static async calculateLeaveDuration(employeeId, startDate, endDate) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { schedule: true },
        });

        const schedule = employee?.schedule;
        let count = 0;
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            let isWorkingDay = true;

            if (schedule) {
                switch (dayOfWeek) {
                    case 0: isWorkingDay = schedule.sunday; break;
                    case 1: isWorkingDay = schedule.monday; break;
                    case 2: isWorkingDay = schedule.tuesday; break;
                    case 3: isWorkingDay = schedule.wednesday; break;
                    case 4: isWorkingDay = schedule.thursday; break;
                    case 5: isWorkingDay = schedule.friday; break;
                    case 6: isWorkingDay = schedule.saturday; break;
                }
            } else {
                if (dayOfWeek === 0 || dayOfWeek === 6) isWorkingDay = false;
            }

            if (isWorkingDay) count++;
            current.setDate(current.getDate() + 1);
        }

        return count;
    }

    static async createLeaveRequest(data) {
        const { employeeId, leaveTypeId, startDate, endDate, reason, source, emailId } = data;

        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) {
            throw new AppError('Leave type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
        }

        const duration = await this.calculateLeaveDuration(employeeId, startDate, endDate);
        if (duration <= 0) {
            throw new AppError('Leave request period contains zero working days', 400, 'INVALID_LEAVE_DURATION');
        }

        // Overlap check
        const overlapping = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });

        if (overlapping) {
            throw new AppError(
                `Overlapping leave request exists from ${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]}`,
                400,
                'LEAVE_OVERLAP'
            );
        }

        // Balance check
        if (leaveType.requiresAllocation) {
            const allocation = await prisma.leaveAllocation.findFirst({
                where: {
                    employeeId,
                    leaveTypeId,
                    periodStart: { lte: startDate },
                    periodEnd: { gte: endDate },
                },
            });

            if (!allocation) {
                throw new AppError('No active leave allocation found for this leave type and period', 400, 'NO_ALLOCATION');
            }

            if (allocation.remainingAmount < duration) {
                throw new AppError(
                    `Insufficient leave balance. Remaining: ${allocation.remainingAmount} days, Requested: ${duration} days.`,
                    400,
                    'INSUFFICIENT_BALANCE'
                );
            }
        }

        // AI/Email MUST create PENDING status only. NO AUTO APPROVAL.
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveTypeId,
                startDate,
                endDate,
                duration,
                reason,
                status: LeaveRequestStatus.PENDING,
                source: source || LeaveSource.MANUAL,
                emailId,
            },
            include: { employee: true, leaveType: true },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'LEAVE_REQUEST_CREATED',
                entity: 'LeaveRequest',
                entityId: leaveRequest.id,
                actorId: employeeId,
                newValue: leaveRequest,
            },
        });

        return leaveRequest;
    }

    static async approveLeaveRequest(id, reviewerId, comment) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id },
            include: { leaveType: true, employee: true },
        });

        if (!request) {
            throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');
        }

        if (request.status !== LeaveRequestStatus.PENDING) {
            throw new AppError(`Cannot approve leave request in ${request.status} status`, 400, 'INVALID_STATUS_TRANSITION');
        }

        // Atomic Prisma Transaction
        return prisma.$transaction(async (tx) => {
            if (request.leaveType.requiresAllocation) {
                const allocation = await tx.leaveAllocation.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                        periodStart: { lte: request.startDate },
                        periodEnd: { gte: request.endDate },
                    },
                });

                if (!allocation) {
                    throw new AppError('No leave allocation found for balance deduction', 400, 'NO_ALLOCATION');
                }

                if (allocation.remainingAmount < request.duration) {
                    throw new AppError('Insufficient leave balance for approval', 400, 'INSUFFICIENT_BALANCE');
                }

                await tx.leaveAllocation.update({
                    where: { id: allocation.id },
                    data: {
                        usedAmount: { increment: request.duration },
                        remainingAmount: { decrement: request.duration },
                    },
                });
            }

            const updatedRequest = await tx.leaveRequest.update({
                where: { id },
                data: {
                    status: LeaveRequestStatus.APPROVED,
                    reviewedById: reviewerId,
                    reviewComment: comment,
                    reviewedAt: new Date(),
                },
                include: { employee: true, leaveType: true },
            });

            await tx.auditLog.create({
                data: {
                    action: 'LEAVE_REQUEST_APPROVED',
                    entity: 'LeaveRequest',
                    entityId: id,
                    actorId: reviewerId,
                    oldValue: { status: LeaveRequestStatus.PENDING },
                    newValue: { status: LeaveRequestStatus.APPROVED, comment },
                },
            });

            return updatedRequest;
        });
    }

    static async refuseLeaveRequest(id, reviewerId, comment) {
        const request = await prisma.leaveRequest.findUnique({ where: { id } });
        if (!request) throw new AppError('Leave request not found', 404, 'LEAVE_NOT_FOUND');

        if (request.status !== LeaveRequestStatus.PENDING) {
            throw new AppError(`Cannot refuse leave request in ${request.status} status`, 400, 'INVALID_STATUS_TRANSITION');
        }

        const updatedRequest = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: LeaveRequestStatus.REFUSED,
                reviewedById: reviewerId,
                reviewComment: comment,
                reviewedAt: new Date(),
            },
        });

        await prisma.auditLog.create({
            data: {
                action: 'LEAVE_REQUEST_REFUSED',
                entity: 'LeaveRequest',
                entityId: id,
                actorId: reviewerId,
                newValue: { status: LeaveRequestStatus.REFUSED, comment },
            },
        });

        return updatedRequest;
    }

    static async getLeaveRequests(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.status) where.status = params.status;
        if (params.leaveTypeId) where.leaveTypeId = params.leaveTypeId;

        return prisma.leaveRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } },
                leaveType: true,
                reviewedBy: { select: { id: true, email: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }
}
