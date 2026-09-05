import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class ScheduleService {
    static calculateWeeklyHours(data) {
        const hoursPerDay = data.hoursPerDay || 8;
        const workingDaysCount = [
            data.monday,
            data.tuesday,
            data.wednesday,
            data.thursday,
            data.friday,
            data.saturday,
            data.sunday,
        ].filter(Boolean).length;

        return hoursPerDay * workingDaysCount;
    }

    static async getSchedules() {
        return prisma.workingSchedule.findMany({
            include: {
                _count: { select: { employees: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    static async getScheduleById(id) {
        const schedule = await prisma.workingSchedule.findUnique({
            where: { id },
            include: {
                employees: {
                    select: { id: true, firstName: true, lastName: true, email: true, designation: true },
                },
            },
        });

        if (!schedule) {
            throw new AppError('Working schedule not found', 404, 'SCHEDULE_NOT_FOUND');
        }

        return schedule;
    }

    static async createSchedule(data) {
        const weeklyHours = this.calculateWeeklyHours(data);

        return prisma.workingSchedule.create({
            data: {
                ...data,
                weeklyHours,
            },
        });
    }

    static async updateSchedule(id, data) {
        const existing = await this.getScheduleById(id);
        const merged = { ...existing, ...data };
        const weeklyHours = this.calculateWeeklyHours(merged);

        return prisma.workingSchedule.update({
            where: { id },
            data: {
                ...data,
                weeklyHours,
            },
        });
    }

    static async deleteSchedule(id) {
        await this.getScheduleById(id);
        const assignedCount = await prisma.employee.count({ where: { scheduleId: id } });
        if (assignedCount > 0) {
            throw new AppError('Cannot delete schedule assigned to employees', 400, 'SCHEDULE_IN_USE');
        }

        return prisma.workingSchedule.delete({ where: { id } });
    }
}
