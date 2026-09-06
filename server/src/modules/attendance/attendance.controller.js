import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec } from 'child_process';
import { AttendanceService } from './attendance.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { prisma } from '../../config/prisma.js';
import { AttendanceStatus } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const checkIn = async (req, res, next) => {
    try {
        let empId = req.body.employeeId || req.user.employeeId;
        if (req.user.role === 'EMPLOYEE') {
            empId = req.user.employeeId;
        }
        if (!empId) {
            return ApiResponse.error(res, 'User profile must be associated with an Employee record to check in', 'NO_EMPLOYEE_PROFILE', 400);
        }
        const record = await AttendanceService.checkIn(empId, req.body.date, req.body.correctionReason);
        return ApiResponse.success(res, record, 201);
    } catch (error) {
        next(error);
    }
};

export const checkOut = async (req, res, next) => {
    try {
        let empId = req.body.employeeId || req.user.employeeId;
        if (req.user.role === 'EMPLOYEE') {
            empId = req.user.employeeId;
        }
        if (!empId) {
            return ApiResponse.error(res, 'User profile must be associated with an Employee record to check out', 'NO_EMPLOYEE_PROFILE', 400);
        }
        const record = await AttendanceService.checkOut(empId, req.body.date, req.body.correctionReason);
        return ApiResponse.success(res, record, 200);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceRecords = async (req, res, next) => {
    try {
        const query = { ...req.query };
        if (req.user.role === 'EMPLOYEE') {
            query.employeeId = req.user.employeeId;
        }
        const result = await AttendanceService.getAttendanceRecords(query);
        return ApiResponse.success(res, result.records, 200, result.pagination);
    } catch (error) {
        next(error);
    }
};

export const getAttendanceById = async (req, res, next) => {
    try {
        const record = await AttendanceService.getAttendanceById(req.params.id);
        if (req.user.role === 'EMPLOYEE' && record.employeeId !== req.user.employeeId) {
            return ApiResponse.error(res, 'Unauthorized access to attendance record', 'FORBIDDEN', 403);
        }
        return ApiResponse.success(res, record);
    } catch (error) {
        next(error);
    }
};

export const correctAttendance = async (req, res, next) => {
    try {
        const record = await AttendanceService.correctAttendance(req.params.id, req.user.id, req.body);
        return ApiResponse.success(res, record);
    } catch (error) {
        next(error);
    }
};

export const getBiometricLogs = async (req, res, next) => {
    try {
        const logsPath = path.resolve(__dirname, '../../../../transfer_learning/attendance_logs.json');
        if (fs.existsSync(logsPath)) {
            const data = fs.readFileSync(logsPath, 'utf-8');
            let logs = JSON.parse(data || '[]');
            if (Array.isArray(logs)) {
                logs.sort((a, b) => {
                    const getTs = (item) => {
                        if (item.checkIn) {
                            const t = new Date(item.checkIn).getTime();
                            if (!isNaN(t)) return t;
                        }
                        if (item.date && item.checkInTime) {
                            const t = new Date(`${item.date} ${item.checkInTime}`).getTime();
                            if (!isNaN(t)) return t;
                        }
                        if (item.createdAt) {
                            const t = new Date(item.createdAt).getTime();
                            if (!isNaN(t)) return t;
                        }
                        if (item.date) {
                            const t = new Date(item.date).getTime();
                            if (!isNaN(t)) return t;
                        }
                        return 0;
                    };
                    const tsA = getTs(a);
                    const tsB = getTs(b);
                    if (tsB !== tsA) return tsB - tsA;
                    return (b.id || '').localeCompare(a.id || '');
                });
            }
            return ApiResponse.success(res, logs);
        }
        return ApiResponse.success(res, []);
    } catch (error) {
        next(error);
    }
};

export const launchCamera = async (req, res, next) => {
    try {
        const transferLearningDir = path.resolve(__dirname, '../../../../transfer_learning');
        const batPath = path.resolve(__dirname, '../../../../../run_webcam.bat');
        if (fs.existsSync(batPath)) {
            exec(`cmd.exe /c start "" "${batPath}"`);
        } else {
            exec(`cmd.exe /c start cmd /k "cd /d "${transferLearningDir}" && python main.py"`);
        }
        return ApiResponse.success(res, { message: 'Live webcam attendance launched successfully' });
    } catch (error) {
        next(error);
    }
};

export const recordLivePunch = async (req, res, next) => {
    try {
        const { employeeNumber, action, matchConfidence, entryId, timeStr: reqTimeStr, isoNow: reqIsoNow, workedHours: reqWorkedHours } = req.body;
        if (!employeeNumber || !action) {
            return ApiResponse.error(res, 'employeeNumber and action are required', 'BAD_REQUEST', 400);
        }

        const employee = await prisma.employee.findFirst({
            where: {
                OR: [
                    { employeeNumber },
                    { employeeNumber: employeeNumber.replace('-', '') },
                ],
            },
        });

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const pad = n => String(n).padStart(2, '0');
        const localIso = `${year}-${month}-${day}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const timeStr = reqTimeStr || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isoNow = reqIsoNow || localIso;

        // 1. Sync to attendance_logs.json
        const logsPath = path.resolve(__dirname, '../../../../transfer_learning/attendance_logs.json');
        let logs = [];
        if (fs.existsSync(logsPath)) {
            try {
                logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]');
            } catch (_) {
                logs = [];
            }
        }

        const empName = employee ? `${employee.firstName} ${employee.lastName}` : employeeNumber;
        let targetLog = null;

        if (action === 'CHECK_IN') {
            // Check if entry with entryId was already inserted by python
            if (entryId) {
                targetLog = logs.find(l => l.id === entryId);
            }
            // Check if there is an OPEN entry today for this employee
            if (!targetLog) {
                targetLog = logs.find(l => 
                    (l.employeeNumber === employeeNumber || l.employee?.employeeNumber === employeeNumber) && 
                    l.date === todayStr && 
                    !l.checkOut
                );
            }

            if (targetLog) {
                // Keep open session, update checkIn details
                targetLog.checkIn = isoNow;
                targetLog.checkInTime = timeStr;
                targetLog.status = 'PRESENT';
                targetLog.matchConfidence = matchConfidence || targetLog.matchConfidence || 85.0;
            } else {
                // ALWAYS CREATE A BRAND NEW ENTRY when previous session is finished or new scan!
                targetLog = {
                    id: entryId || `ATT-${Date.now()}`,
                    employee: {
                        firstName: employee?.firstName || empName.split(' ')[0],
                        lastName: employee?.lastName || (empName.split(' ')[1] || ''),
                        employeeNumber: employeeNumber,
                    },
                    employeeNumber: employeeNumber,
                    name: empName,
                    date: todayStr,
                    checkIn: isoNow,
                    checkInTime: timeStr,
                    checkOut: '',
                    checkOutTime: '',
                    workedHours: 0.0,
                    overtimeHours: 0.0,
                    status: 'PRESENT',
                    actions: '',
                    matchConfidence: matchConfidence || 85.0,
                };
                logs.unshift(targetLog);
            }

            // 2. Insert into PostgreSQL as a NEW ENTRY!
            if (employee) {
                try {
                    const todayMidnight = new Date(year, now.getMonth(), now.getDate());
                    const newDbId = crypto.randomUUID();
                    await prisma.$executeRawUnsafe(
                        `INSERT INTO "Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workedHours", status, "createdAt", "updatedAt")
                         VALUES ($1, $2, $3, $4, NULL, 0.0, 'PRESENT'::"AttendanceStatus", $5, $6)`,
                        newDbId,
                        employee.id,
                        todayMidnight,
                        now,
                        now,
                        now
                    );
                    targetLog.dbId = newDbId;
                } catch (err) {
                    console.warn('[WARN] PostgreSQL check-in insert failed:', err.message);
                }
            }

        } else if (action === 'CHECK_OUT') {
            // Find target entry to close
            if (entryId) {
                targetLog = logs.find(l => l.id === entryId);
            }
            if (!targetLog) {
                // Find most recent open entry for this employee
                targetLog = logs.find(l => 
                    (l.employeeNumber === employeeNumber || l.employee?.employeeNumber === employeeNumber) && 
                    !l.checkOut
                );
            }

            let workedHours = reqWorkedHours || 0.0;

            if (targetLog) {
                targetLog.checkOut = isoNow;
                targetLog.checkOutTime = timeStr;
                targetLog.status = 'PRESENT';
                targetLog.matchConfidence = matchConfidence || targetLog.matchConfidence || 85.0;

                if (!workedHours) {
                    if (targetLog.checkIn) {
                        const ciTime = new Date(targetLog.checkIn).getTime();
                        const diffS = Math.max(0, (now.getTime() - ciTime) / 1000);
                        workedHours = Math.max(0.01, Math.round((diffS / 3600) * 100) / 100);
                    } else {
                        workedHours = 8.0;
                    }
                }
                targetLog.workedHours = workedHours;
                targetLog.overtimeHours = Math.max(0, Math.round((workedHours - 8.0) * 100) / 100);

                // Update in PostgreSQL
                if (employee) {
                    try {
                        if (targetLog.dbId) {
                            await prisma.$executeRawUnsafe(
                                `UPDATE "Attendance" 
                                 SET "checkOut" = $1, "workedHours" = $2, "updatedAt" = $3 
                                 WHERE id = $4`,
                                now,
                                workedHours,
                                now,
                                targetLog.dbId
                            );
                        } else {
                            const openRows = await prisma.$queryRawUnsafe(
                                `SELECT id FROM "Attendance" 
                                 WHERE "employeeId" = $1 AND "checkOut" IS NULL 
                                 ORDER BY "createdAt" DESC LIMIT 1`,
                                employee.id
                            );
                            if (openRows && openRows.length > 0) {
                                await prisma.$executeRawUnsafe(
                                    `UPDATE "Attendance" 
                                     SET "checkOut" = $1, "workedHours" = $2, "updatedAt" = $3 
                                     WHERE id = $4`,
                                    now,
                                    workedHours,
                                    now,
                                    openRows[0].id
                                );
                            } else {
                                const newDbId = crypto.randomUUID();
                                const todayMidnight = new Date(year, now.getMonth(), now.getDate());
                                await prisma.$executeRawUnsafe(
                                    `INSERT INTO "Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workedHours", status, "createdAt", "updatedAt")
                                     VALUES ($1, $2, $3, $4, $5, $6, 'PRESENT'::"AttendanceStatus", $7, $8)`,
                                    newDbId,
                                    employee.id,
                                    todayMidnight,
                                    now,
                                    now,
                                    workedHours,
                                    now,
                                    now
                                );
                            }
                        }
                    } catch (err) {
                        console.warn('[WARN] PostgreSQL check-out update failed:', err.message);
                    }
                }
            } else {
                // If no entry exists at all, create a brand new completed entry
                workedHours = reqWorkedHours || 8.0;
                const shiftStart = new Date(now.getTime() - 8 * 3600 * 1000);
                targetLog = {
                    id: entryId || `ATT-${Date.now()}`,
                    employee: {
                        firstName: employee?.firstName || empName.split(' ')[0],
                        lastName: employee?.lastName || (empName.split(' ')[1] || ''),
                        employeeNumber: employeeNumber,
                    },
                    employeeNumber: employeeNumber,
                    name: empName,
                    date: todayStr,
                    checkIn: shiftStart.toISOString().slice(0, 19),
                    checkInTime: shiftStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    checkOut: isoNow,
                    checkOutTime: timeStr,
                    workedHours: workedHours,
                    overtimeHours: 0.0,
                    status: 'PRESENT',
                    actions: '',
                    matchConfidence: matchConfidence || 85.0,
                };
                logs.unshift(targetLog);

                if (employee) {
                    try {
                        const newDbId = crypto.randomUUID();
                        const todayMidnight = new Date(year, now.getMonth(), now.getDate());
                        await prisma.$executeRawUnsafe(
                            `INSERT INTO "Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workedHours", status, "createdAt", "updatedAt")
                             VALUES ($1, $2, $3, $4, $5, $6, 'PRESENT'::"AttendanceStatus", $7, $8)`,
                            newDbId,
                            employee.id,
                            todayMidnight,
                            shiftStart,
                            now,
                            workedHours,
                            now,
                            now
                        );
                        targetLog.dbId = newDbId;
                    } catch (err) {
                        console.warn('[WARN] PostgreSQL insert failed:', err.message);
                    }
                }
            }
        }

        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf-8');
        return ApiResponse.success(res, { message: `Live punch recorded: ${action}`, record: targetLog });
    } catch (error) {
        next(error);
    }
};

