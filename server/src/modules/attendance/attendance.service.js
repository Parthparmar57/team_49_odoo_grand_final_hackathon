import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class AttendanceService {
    static async checkIn(employeeId, date = new Date(), correctionReason) {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
        });

        if (existing && existing.checkIn) {
            throw new AppError('Already checked in for today', 400, 'ALREADY_CHECKED_IN');
        }

        const checkInTime = new Date(date);

        if (existing) {
            return prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    checkIn: checkInTime,
                    status: AttendanceStatus.PRESENT,
                    correctionReason,
                },
            });
        }

        return prisma.attendance.create({
            data: {
                employeeId,
                date: today,
                checkIn: checkInTime,
                status: AttendanceStatus.PRESENT,
                correctionReason,
            },
        });
    }

    static async checkOut(employeeId, date = new Date(), correctionReason) {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId,
                    date: today,
                },
            },
        });

        if (!attendance || !attendance.checkIn) {
            throw new AppError('Must check in before checking out', 400, 'NO_CHECK_IN');
        }

        if (attendance.checkOut) {
            throw new AppError('Already checked out for today', 400, 'ALREADY_CHECKED_OUT');
        }

        const checkOutTime = new Date(date);
        if (checkOutTime < attendance.checkIn) {
            throw new AppError('Check-out timestamp cannot be before check-in timestamp', 400, 'INVALID_CHECKOUT_TIME');
        }

        const diffMs = checkOutTime.getTime() - attendance.checkIn.getTime();
        const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

        let status = AttendanceStatus.PRESENT;
        if (workedHours < 4) status = AttendanceStatus.HALF_DAY;
        if (workedHours > 9) status = AttendanceStatus.OVERTIME;

        return prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: checkOutTime,
                workedHours,
                status,
                correctionReason,
            },
        });
    }

    static async getAttendanceRecords(params = {}) {
        const where = {};
        if (params.employeeId) where.employeeId = params.employeeId;
        if (params.status) where.status = params.status;
        if (params.startDate || params.endDate) {
            where.date = {};
            if (params.startDate) where.date.gte = new Date(params.startDate);
            if (params.endDate) where.date.lte = new Date(params.endDate);
        }

        return prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    static async getAttendanceById(id) {
        const record = await prisma.attendance.findUnique({
            where: { id },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        if (!record) {
            throw new AppError('Attendance record not found', 404, 'ATTENDANCE_NOT_FOUND');
        }

        return record;
    }

    static async correctAttendance(id, actorId, data) {
        const existing = await this.getAttendanceById(id);

        if (!data.correctionReason) {
            throw new AppError('Correction reason is required for attendance adjustments', 400, 'REASON_REQUIRED');
        }

        let checkIn = data.checkIn ? new Date(data.checkIn) : existing.checkIn;
        let checkOut = data.checkOut ? new Date(data.checkOut) : existing.checkOut;
        let workedHours = data.workedHours;

        if (checkIn && checkOut) {
            if (checkOut < checkIn) {
                throw new AppError('Check-out timestamp cannot be before check-in timestamp', 400, 'INVALID_CHECKOUT_TIME');
            }
            if (workedHours === undefined) {
                const diffMs = checkOut.getTime() - checkIn.getTime();
                workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
            }
        }

        const updated = await prisma.attendance.update({
            where: { id },
            data: {
                checkIn,
                checkOut,
                workedHours,
                status: data.status || existing.status,
                correctionReason: data.correctionReason,
            },
            include: { employee: true },
        });

        await prisma.auditLog.create({
            data: {
                action: 'ATTENDANCE_CORRECTION',
                entity: 'Attendance',
                entityId: id,
                actorId,
                oldValue: existing,
                newValue: updated,
            },
        });

        return updated;
    }
}
