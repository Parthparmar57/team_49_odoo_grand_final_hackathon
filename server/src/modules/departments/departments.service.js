import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

export class DepartmentsService {
    static async getDepartments() {
        return prisma.department.findMany({
            include: {
                _count: { select: { employees: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    static async getDepartmentById(id) {
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                employees: {
                    select: { id: true, firstName: true, lastName: true, email: true, designation: true },
                },
            },
        });

        if (!department) {
            throw new AppError('Department not found', 404, 'DEPARTMENT_NOT_FOUND');
        }

        return department;
    }

    static async createDepartment(data) {
        const existing = await prisma.department.findFirst({
            where: {
                OR: [{ name: data.name }, { code: data.code }],
            },
        });

        if (existing) {
            throw new AppError('Department with this name or code already exists', 400, 'DEPARTMENT_EXISTS');
        }

        return prisma.department.create({ data });
    }

    static async updateDepartment(id, data) {
        await this.getDepartmentById(id);

        if (data.name || data.code) {
            const existing = await prisma.department.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        ...(data.name ? [{ name: data.name }] : []),
                        ...(data.code ? [{ code: data.code }] : []),
                    ],
                },
            });

            if (existing) {
                throw new AppError('Department with this name or code already exists', 400, 'DEPARTMENT_EXISTS');
            }
        }

        return prisma.department.update({
            where: { id },
            data,
        });
    }

    static async deleteDepartment(id) {
        await this.getDepartmentById(id);
        const count = await prisma.employee.count({ where: { departmentId: id } });
        if (count > 0) {
            throw new AppError('Cannot delete department with assigned employees', 400, 'DEPARTMENT_IN_USE');
        }

        return prisma.department.delete({ where: { id } });
    }
}
