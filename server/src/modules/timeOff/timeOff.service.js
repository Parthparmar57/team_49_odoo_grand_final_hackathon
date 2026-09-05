import { LeaveRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class TimeOffService {
    // ==========================================
    // 1. TIME OFF TYPE MANAGEMENT
    // ==========================================

    static async getTimeOffTypes(includeInactive = false) {
        const where = includeInactive ? {} : { active: true };
        return prisma.leaveType.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    static async getTimeOffTypeById(id) {
        const type = await prisma.leaveType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { allocations: true, requests: true },
                },
            },
        });

        if (!type) {
            throw new AppError('Time off type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
        }

        return type;
    }

    static async createTimeOffType(data) {
        const existing = await prisma.leaveType.findFirst({
            where: {
                OR: [{ name: data.name }, { code: data.code }],
            },
        });

        if (existing) {
            throw new AppError('Time off type with this name or code already exists', 400, 'LEAVE_TYPE_EXISTS');
        }

        const type = await prisma.leaveType.create({
            data: {
                name: data.name,
                code: data.code,
                unit: data.unit || 'DAYS',
                requiresAllocation: data.requiresAllocation ?? true,
                approvalRequired: data.approvalRequired ?? true,
                allowNegativeBalance: data.allowNegativeBalance ?? false,
                payrollImpact: data.payrollImpact ?? true,
                description: data.description,
                active: data.active ?? true,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: 'TIME_OFF_TYPE_CREATED',
                entity: 'LeaveType',
                entityId: type.id,
                metadata: { name: type.name, code: type.code },
            },
        });

        return type;
    }

    static async updateTimeOffType(id, data) {
        const existing = await this.getTimeOffTypeById(id);

        if (data.name || data.code) {
            const duplicate = await prisma.leaveType.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(data.name ? [{ name: data.name }] : []),
                        ...(data.code ? [{ code: data.code }] : []),
                    ],
                },
            });

            if (duplicate) {
                throw new AppError('Time off type with this name or code already exists', 400, 'LEAVE_TYPE_EXISTS');
            }
        }

        const updated = await prisma.leaveType.update({
            where: { id },
            data,
        });

        await prisma.auditLog.create({
            data: {
                action: 'TIME_OFF_TYPE_UPDATED',
                entity: 'LeaveType',
                entityId: id,
                metadata: { oldValue: existing, newValue: updated },
            },
        });

        return updated;
    }

    static async deleteTimeOffType(id) {
        const type = await this.getTimeOffTypeById(id);

        const count = await prisma.leaveRequest.count({ where: { leaveTypeId: id } });
        if (count > 0) {
            // Soft-deactivate if historical leave data exists
            const deactivated = await prisma.leaveType.update({
                where: { id },
                data: { active: false },
            });

            await prisma.auditLog.create({
                data: {
                    action: 'TIME_OFF_TYPE_DEACTIVATED',
                    entity: 'LeaveType',
                    entityId: id,
                    metadata: { reason: 'Historical leave requests exist' },
                },
            });

            return { deactivated: true, message: 'Time off type has active historical data and was deactivated instead of deleted.' };
        }

        await prisma.leaveType.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: 'TIME_OFF_TYPE_DELETED',
                entity: 'LeaveType',
                entityId: id,
            },
        });

        return { deleted: true, message: 'Time off type deleted successfully' };
    }

    // ==========================================
    // 2. ALLOCATION MANAGEMENT
    // ==========================================

    static async getTimeOffAllocations(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.leaveTypeId) where.leaveTypeId = params.leaveTypeId;

        return prisma.leaveAllocation.findMany({
            where,
            include: {
                leaveType: true,
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true },
                },
            },
            orderBy: { periodStart: 'desc' },
        });
    }

    static async getTimeOffAllocationById(id) {
        const allocation = await prisma.leaveAllocation.findUnique({
            where: { id },
            include: {
                leaveType: true,
                employee: true,
            },
        });

        if (!allocation) {
            throw new AppError('Leave allocation not found', 404, 'ALLOCATION_NOT_FOUND');
        }

        return allocation;
    }

    static async createAllocation(data) {
        const { employeeId, leaveTypeId, allocatedAmount, periodStart, periodEnd } = data;

        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        if (end < start) {
            throw new AppError('Period end date cannot be before period start date', 400, 'INVALID_DATE_RANGE');
        }

        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) {
            throw new AppError('Time off type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
        }

        const existing = await prisma.leaveAllocation.findFirst({
            where: {
                employeeId,
                leaveTypeId,
                periodStart: start,
                periodEnd: end,
            },
        });

        if (existing) {
            throw new AppError('An allocation for this employee, leave type, and period already exists', 400, 'ALLOCATION_EXISTS');
        }

        const remainingAmount = allocatedAmount;

        const allocation = await prisma.leaveAllocation.create({
            data: {
                employeeId,
                leaveTypeId,
                allocatedAmount,
                usedAmount: 0,
                remainingAmount,
                periodStart: start,
                periodEnd: end,
            },
            include: { leaveType: true, employee: true },
        });

        await prisma.auditLog.create({
            data: {
                action: 'ALLOCATION_CREATED',
                entity: 'LeaveAllocation',
                entityId: allocation.id,
                metadata: { employeeId, leaveTypeId, allocatedAmount },
            },
        });

        return allocation;
    }

    static async updateAllocation(id, data) {
        const existing = await this.getTimeOffAllocationById(id);

        const allocatedAmount = data.allocatedAmount !== undefined ? data.allocatedAmount : existing.allocatedAmount;
        const usedAmount = data.usedAmount !== undefined ? data.usedAmount : existing.usedAmount;

        if (allocatedAmount < usedAmount && !existing.leaveType.allowNegativeBalance) {
            throw new AppError(`Allocated amount (${allocatedAmount}) cannot be less than used amount (${usedAmount})`, 400, 'INVALID_ALLOCATION');
        }

        const remainingAmount = allocatedAmount - usedAmount;

        const updated = await prisma.leaveAllocation.update({
            where: { id },
            data: {
                allocatedAmount,
                usedAmount,
                remainingAmount,
                periodStart: data.periodStart ? new Date(data.periodStart) : existing.periodStart,
                periodEnd: data.periodEnd ? new Date(data.periodEnd) : existing.periodEnd,
            },
            include: { leaveType: true, employee: true },
        });

        await prisma.auditLog.create({
            data: {
                action: 'ALLOCATION_UPDATED',
                entity: 'LeaveAllocation',
                entityId: id,
                metadata: { oldValue: existing, newValue: updated },
            },
        });

        return updated;
    }

    static async deleteAllocation(id) {
        const allocation = await this.getTimeOffAllocationById(id);

        if (allocation.usedAmount > 0) {
            throw new AppError('Cannot delete allocation with used leave days', 400, 'ALLOCATION_IN_USE');
        }

        await prisma.leaveAllocation.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: 'ALLOCATION_DELETED',
                entity: 'LeaveAllocation',
                entityId: id,
            },
        });

        return { message: 'Allocation deleted successfully' };
    }

    static async getEmployeeBalance(employeeId) {
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        const leaveTypes = await prisma.leaveType.findMany({ where: { active: true } });
        const allocations = await prisma.leaveAllocation.findMany({
            where: { employeeId },
            include: { leaveType: true },
        });

        const balances = leaveTypes.map((type) => {
            const typeAllocations = allocations.filter((a) => a.leaveTypeId === type.id);
            const allocated = typeAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
            const used = typeAllocations.reduce((sum, a) => sum + a.usedAmount, 0);
            const remaining = allocated - used;

            return {
                leaveTypeId: type.id,
                leaveTypeName: type.name,
                leaveTypeCode: type.code,
                unit: type.unit,
                requiresAllocation: type.requiresAllocation,
                allowNegativeBalance: type.allowNegativeBalance,
                allocated,
                used,
                remaining,
            };
        });

        return {
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            balances,
        };
    }

    // ==========================================
    // 3. DETERMINISTIC WORKING-DAY CALCULATION
    // ==========================================

    static async calculateWorkingDays(employeeId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { schedule: true },
        });

        const schedule = employee?.schedule || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
        };

        const dayMap = {
            0: schedule.sunday,
            1: schedule.monday,
            2: schedule.tuesday,
            3: schedule.wednesday,
            4: schedule.thursday,
            5: schedule.friday,
            6: schedule.saturday,
        };

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

    // ==========================================
    // 4. LEAVE REQUEST MANAGEMENT & WORKFLOW
    // ==========================================

    static async getTimeOffRequests(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.leaveTypeId) where.leaveTypeId = params.leaveTypeId;
        if (params.status) where.status = params.status;
        if (params.startDate || params.endDate) {
            where.startDate = {};
            if (params.startDate) where.startDate.gte = new Date(params.startDate);
            if (params.endDate) where.startDate.lte = new Date(params.endDate);
        }

        return prisma.leaveRequest.findMany({
            where,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true },
                },
                leaveType: true,
                reviewedBy: {
                    select: { id: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getTimeOffRequestById(id) {
        const request = await prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true } },
                leaveType: true,
                reviewedBy: { select: { id: true, email: true, role: true } },
            },
        });

        if (!request) {
            throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
        }

        return request;
    }

    static async createLeaveRequest(data, actorUserId) {
        const { employeeId, leaveTypeId, startDate, endDate, reason } = data;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
        }

        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
        }

        const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
        if (!leaveType) {
            throw new AppError('Time off type not found', 404, 'LEAVE_TYPE_NOT_FOUND');
        }

        if (!leaveType.active) {
            throw new AppError('Cannot submit request for an inactive time off type', 400, 'INACTIVE_LEAVE_TYPE');
        }

        // Overlap Detection
        const overlapping = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
                startDate: { lte: end },
                endDate: { gte: start },
            },
        });

        if (overlapping) {
            throw new AppError('An overlapping active leave request already exists for this date range', 400, 'OVERLAPPING_LEAVE');
        }

        // Working-Day Calculation
        const duration = await this.calculateWorkingDays(employeeId, start, end);
        if (duration <= 0) {
            throw new AppError('Selected date range contains no working days according to schedule', 400, 'NO_WORKING_DAYS');
        }

        // Balance Check
        if (leaveType.requiresAllocation) {
            const allocation = await prisma.leaveAllocation.findFirst({
                where: {
                    employeeId,
                    leaveTypeId,
                },
                orderBy: { periodStart: 'desc' },
            });

            if (!allocation && !leaveType.allowNegativeBalance) {
                throw new AppError('No active leave allocation found for this period', 400, 'NO_ALLOCATION_FOUND');
            }

            if (allocation) {
                const remaining = allocation.allocatedAmount - allocation.usedAmount;
                if (duration > remaining && !leaveType.allowNegativeBalance) {
                    throw new AppError(`Insufficient leave balance. Requested: ${duration} days, Available: ${remaining} days`, 400, 'INSUFFICIENT_BALANCE');
                }
            }
        }

        const request = await prisma.leaveRequest.create({
            data: {
                employeeId,
                leaveTypeId,
                startDate: start,
                endDate: end,
                duration,
                reason,
                status: LeaveRequestStatus.PENDING,
            },
            include: { leaveType: true, employee: true },
        });

        await prisma.auditLog.create({
            data: {
                actorId: actorUserId,
                action: 'LEAVE_REQUEST_CREATED',
                entity: 'LeaveRequest',
                entityId: request.id,
                metadata: { employeeId, leaveTypeId, duration, startDate: start, endDate: end },
            },
        });

        return request;
    }

    // ==========================================
    // 5. ATOMIC APPROVAL TRANSACTION
    // ==========================================

    static async approveLeaveRequest(requestId, reviewerUserId) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.findUnique({
                where: { id: requestId },
                include: { leaveType: true },
            });

            if (!request) {
                throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
            }

            if (request.status !== LeaveRequestStatus.PENDING) {
                throw new AppError(`Cannot approve request with status '${request.status}' (Must be PENDING)`, 400, 'INVALID_STATE_TRANSITION');
            }

            // Revalidate balance inside transaction
            if (request.leaveType.requiresAllocation) {
                const allocation = await tx.leaveAllocation.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                    },
                    orderBy: { periodStart: 'desc' },
                });

                if (allocation) {
                    const remaining = allocation.allocatedAmount - allocation.usedAmount;
                    if (request.duration > remaining && !request.leaveType.allowNegativeBalance) {
                        throw new AppError(`Insufficient leave balance during approval. Requested: ${request.duration}, Available: ${remaining}`, 400, 'INSUFFICIENT_BALANCE');
                    }

                    const newUsed = allocation.usedAmount + request.duration;
                    const newRemaining = allocation.allocatedAmount - newUsed;

                    await tx.leaveAllocation.update({
                        where: { id: allocation.id },
                        data: {
                            usedAmount: newUsed,
                            remainingAmount: newRemaining,
                        },
                    });
                }
            }

            const updated = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: LeaveRequestStatus.APPROVED,
                    reviewedById: reviewerUserId,
                    reviewedAt: new Date(),
                },
                include: { leaveType: true, employee: true, reviewedBy: true },
            });

            await tx.auditLog.create({
                data: {
                    actorId: reviewerUserId,
                    action: 'LEAVE_REQUEST_APPROVED',
                    entity: 'LeaveRequest',
                    entityId: requestId,
                    metadata: { oldValue: { status: request.status }, newValue: { status: LeaveRequestStatus.APPROVED }, duration: request.duration, employeeId: request.employeeId },
                },
            });

            return updated;
        });
    }

    // ==========================================
    // 6. REFUSAL WORKFLOW
    // ==========================================

    static async refuseLeaveRequest(requestId, reviewerUserId, rejectionReason) {
        if (!rejectionReason || rejectionReason.trim().length < 3) {
            throw new AppError('Refusal reason is mandatory', 400, 'REFUSAL_REASON_REQUIRED');
        }

        const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
        if (!request) {
            throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
        }

        if (request.status !== LeaveRequestStatus.PENDING) {
            throw new AppError(`Cannot refuse request with status '${request.status}' (Must be PENDING)`, 400, 'INVALID_STATE_TRANSITION');
        }

        const updated = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: LeaveRequestStatus.REFUSED,
                reviewedById: reviewerUserId,
                reviewedAt: new Date(),
                reviewComment: rejectionReason,
            },
            include: { leaveType: true, employee: true, reviewedBy: true },
        });

        await prisma.auditLog.create({
            data: {
                actorId: reviewerUserId,
                action: 'LEAVE_REQUEST_REFUSED',
                entity: 'LeaveRequest',
                entityId: requestId,
                metadata: { rejectionReason },
            },
        });

        return updated;
    }

    // ==========================================
    // 7. ATOMIC CANCELLATION WORKFLOW
    // ==========================================

    static async cancelLeaveRequest(requestId, actorUserId, cancellationReason) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.findUnique({
                where: { id: requestId },
                include: { leaveType: true },
            });

            if (!request) {
                throw new AppError('Time off request not found', 404, 'REQUEST_NOT_FOUND');
            }

            if (request.status !== LeaveRequestStatus.PENDING && request.status !== LeaveRequestStatus.APPROVED) {
                throw new AppError(`Cannot cancel request with status '${request.status}'`, 400, 'INVALID_STATE_TRANSITION');
            }

            // If request was APPROVED, restore consumed allocation
            if (request.status === LeaveRequestStatus.APPROVED && request.leaveType.requiresAllocation) {
                const allocation = await tx.leaveAllocation.findFirst({
                    where: {
                        employeeId: request.employeeId,
                        leaveTypeId: request.leaveTypeId,
                    },
                    orderBy: { periodStart: 'desc' },
                });

                if (allocation) {
                    const restoredUsed = Math.max(0, allocation.usedAmount - request.duration);
                    const restoredRemaining = allocation.allocatedAmount - restoredUsed;

                    await tx.leaveAllocation.update({
                        where: { id: allocation.id },
                        data: {
                            usedAmount: restoredUsed,
                            remainingAmount: restoredRemaining,
                        },
                    });
                }
            }

            const updated = await tx.leaveRequest.update({
                where: { id: requestId },
                data: {
                    status: LeaveRequestStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancellationReason,
                },
                include: { leaveType: true, employee: true },
            });

            await tx.auditLog.create({
                data: {
                    actorId: actorUserId,
                    action: 'LEAVE_REQUEST_CANCELLED',
                    entity: 'LeaveRequest',
                    entityId: requestId,
                    metadata: { previousStatus: request.status, cancellationReason },
                },
            });

            return updated;
        });
    }

    // ==========================================
    // 8. UPDATE / DELETE LEAVE REQUEST GUARDS
    // ==========================================

    static async updateLeaveRequest(id, actorUserId, data) {
        const existing = await this.getTimeOffRequestById(id);

        if (existing.status !== LeaveRequestStatus.PENDING) {
            throw new AppError(`Cannot edit a request that is already ${existing.status}`, 400, 'REQUEST_NOT_EDITABLE');
        }

        const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

        if (endDate < startDate) {
            throw new AppError('End date cannot be before start date', 400, 'INVALID_DATE_RANGE');
        }

        const duration = await this.calculateWorkingDays(existing.employeeId, startDate, endDate);

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                startDate,
                endDate,
                duration,
                leaveTypeId: data.leaveTypeId || existing.leaveTypeId,
                reason: data.reason || existing.reason,
            },
            include: { leaveType: true, employee: true },
        });

        await prisma.auditLog.create({
            data: {
                actorId: actorUserId,
                action: 'LEAVE_REQUEST_UPDATED',
                entity: 'LeaveRequest',
                entityId: id,
                metadata: { oldValue: existing, newValue: updated },
            },
        });

        return updated;
    }

    static async deleteLeaveRequest(id, actorUserId) {
        const existing = await this.getTimeOffRequestById(id);

        if (existing.status === LeaveRequestStatus.APPROVED) {
            throw new AppError('Cannot delete an APPROVED leave request. Use cancellation instead.', 400, 'CANNOT_DELETE_APPROVED');
        }

        await prisma.leaveRequest.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                actorId: actorUserId,
                action: 'LEAVE_REQUEST_DELETED',
                entity: 'LeaveRequest',
                entityId: id,
            },
        });

        return { message: 'Leave request deleted successfully' };
    }
}
