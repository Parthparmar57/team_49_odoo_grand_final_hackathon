import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncJsonLog(entry) {
    try {
        const logsPath = path.resolve(__dirname, '../../../../transfer_learning/attendance_logs.json');
        let logs = [];
        if (fs.existsSync(logsPath)) {
            logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]');
        }
        const idx = logs.findIndex(l => l.id === entry.id || (l.dbId && l.dbId === entry.id));
        if (idx >= 0) {
            logs[idx] = { ...logs[idx], ...entry };
        } else {
            logs.unshift(entry);
        }
        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (_) { }
}

export class AttendanceService {
    static async checkIn(employeeId, date = new Date(), correctionReason) {
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);

        // Check if there is an unclosed session (checked in, but not checked out yet)
        const openSessions = await prisma.$queryRawUnsafe(
            `SELECT id FROM "Attendance"
             WHERE "employeeId" = $1 AND "checkOut" IS NULL
             ORDER BY "createdAt" DESC LIMIT 1`,
            employeeId
        );

        let newId;
        const checkInTime = new Date(date);
        const now = new Date();

        if (openSessions && openSessions.length > 0) {
            newId = openSessions[0].id;
            await prisma.$executeRawUnsafe(
                `UPDATE "Attendance" SET "checkIn" = $1, "updatedAt" = $2 WHERE id = $3`,
                checkInTime,
                now,
                newId
            );
        } else {
            newId = crypto.randomUUID();
            await prisma.$executeRawUnsafe(
                `INSERT INTO "Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workedHours", status, "correctionReason", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NULL, 0.0, 'PRESENT'::"AttendanceStatus", $5, $6, $7)`,
                newId,
                employeeId,
                today,
                checkInTime,
                correctionReason || null,
                now,
                now
            );
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true }
        });

        const pad = n => String(n).padStart(2, '0');
        const year = checkInTime.getFullYear();
        const month = pad(checkInTime.getMonth() + 1);
        const day = pad(checkInTime.getDate());
        const todayStr = `${year}-${month}-${day}`;
        const localIso = `${todayStr}T${pad(checkInTime.getHours())}:${pad(checkInTime.getMinutes())}:${pad(checkInTime.getSeconds())}`;
        const timeStr = checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        syncJsonLog({
            id: `ATT-${Date.now()}`,
            dbId: newId,
            employee: {
                firstName: employee?.firstName || '',
                lastName: employee?.lastName || '',
                employeeNumber: employee?.employeeNumber || '',
            },
            employeeNumber: employee?.employeeNumber || '',
            name: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
            date: todayStr,
            checkIn: localIso,
            checkInTime: timeStr,
            checkOut: '',
            checkOutTime: '',
            workedHours: 0.0,
            overtimeHours: 0.0,
            status: 'PRESENT',
            actions: '',
            matchConfidence: 95.0,
        });

        return prisma.attendance.findUnique({
            where: { id: newId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } }
            }
        });
    }

    static async checkOut(employeeId, date = new Date(), correctionReason) {
        // Find latest open session
        const openSessions = await prisma.$queryRawUnsafe(
            `SELECT id, "checkIn" FROM "Attendance"
             WHERE "employeeId" = $1 AND "checkOut" IS NULL
             ORDER BY "createdAt" DESC LIMIT 1`,
            employeeId
        );

        const checkOutTime = new Date(date);
        const now = new Date();
        let attendanceId;
        let checkInTime;

        if (!openSessions || openSessions.length === 0) {
            attendanceId = crypto.randomUUID();
            const today = new Date(date);
            today.setHours(0, 0, 0, 0);
            checkInTime = new Date(checkOutTime.getTime() - 8 * 3600 * 1000);
            await prisma.$executeRawUnsafe(
                `INSERT INTO "Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workedHours", status, "correctionReason", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NULL, 0.0, 'PRESENT'::"AttendanceStatus", $5, $6, $7)`,
                attendanceId,
                employeeId,
                today,
                checkInTime,
                correctionReason || null,
                now,
                now
            );
        } else {
            attendanceId = openSessions[0].id;
            checkInTime = new Date(openSessions[0].checkIn);
        }

        const diffMs = Math.max(0, checkOutTime.getTime() - checkInTime.getTime());
        const workedHours = Math.max(0.01, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);

        let status = AttendanceStatus.PRESENT;
        if (workedHours < 4) status = AttendanceStatus.HALF_DAY;
        if (workedHours > 9) status = AttendanceStatus.OVERTIME;

        await prisma.$executeRawUnsafe(
            `UPDATE "Attendance"
             SET "checkOut" = $1, "workedHours" = $2, status = $3::"AttendanceStatus", "correctionReason" = $4, "updatedAt" = $5
             WHERE id = $6`,
            checkOutTime,
            workedHours,
            status,
            correctionReason || null,
            now,
            attendanceId
        );

        const pad = n => String(n).padStart(2, '0');
        const year = checkOutTime.getFullYear();
        const month = pad(checkOutTime.getMonth() + 1);
        const day = pad(checkOutTime.getDate());
        const todayStr = `${year}-${month}-${day}`;
        const localIso = `${todayStr}T${pad(checkOutTime.getHours())}:${pad(checkOutTime.getMinutes())}:${pad(checkOutTime.getSeconds())}`;
        const timeStr = checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, firstName: true, lastName: true, employeeNumber: true, email: true }
        });

        syncJsonLog({
            dbId: attendanceId,
            employee: {
                firstName: employee?.firstName || '',
                lastName: employee?.lastName || '',
                employeeNumber: employee?.employeeNumber || '',
            },
            employeeNumber: employee?.employeeNumber || '',
            name: `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim(),
            date: todayStr,
            checkIn: checkInTime.toISOString().slice(0, 19),
            checkInTime: checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            checkOut: localIso,
            checkOutTime: timeStr,
            workedHours: workedHours,
            overtimeHours: Math.max(0, Math.round((workedHours - 8.0) * 100) / 100),
            status: status,
        });

        return prisma.attendance.findUnique({
            where: { id: attendanceId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true } }
            }
        });
    }

    static async getAttendanceRecords(params = {}) {
        const page = parseInt(params.page || '1', 10);
        const limit = Math.min(parseInt(params.limit || '100', 10), 500);
        const skip = (page - 1) * limit;

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
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' },
            ],
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
                metadata: { before: existing, after: updated },
            },
        });

        return updated;
    }
}
