import { z } from 'zod';
import { Role, EmploymentType, EmployeeStatus, ContractStatus, AttendanceStatus } from '@prisma/client';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.nativeEnum(Role).optional().default(Role.EMPLOYEE),
        employeeNumber: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        departmentId: z.string().optional(),
        designation: z.string().optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

export const createDepartmentSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
    }),
});

export const updateDepartmentSchema = z.object({
    body: createDepartmentSchema.shape.body.partial(),
});

export const createEmployeeSchema = z.object({
    body: z.object({
        employeeNumber: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        designation: z.string().min(1),
        joiningDate: z.string().transform((str) => new Date(str)),
        employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
        status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifscCode: z.string().optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        departmentId: z.string().min(1),
        managerId: z.string().optional(),
        scheduleId: z.string().optional(),
        userId: z.string().optional(),
    }),
});

export const updateEmployeeSchema = z.object({
    body: createEmployeeSchema.shape.body.partial(),
});

export const createContractSchema = z.object({
    body: z.object({
        contractRef: z.string().min(1),
        employeeId: z.string().optional(),
        departmentId: z.string().min(1),
        scheduleId: z.string().optional(),
        salaryStructureId: z.string().optional(),
        wage: z.number().positive(),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),
        notes: z.string().optional(),
    }),
});

export const updateContractSchema = z.object({
    body: createContractSchema.shape.body.partial(),
});

export const createScheduleSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        hoursPerDay: z.number().default(8),
        monday: z.boolean().default(true),
        tuesday: z.boolean().default(true),
        wednesday: z.boolean().default(true),
        thursday: z.boolean().default(true),
        friday: z.boolean().default(true),
        saturday: z.boolean().default(false),
        sunday: z.boolean().default(false),
    }),
});

export const updateScheduleSchema = z.object({
    body: createScheduleSchema.shape.body.partial(),
});

export const checkInSchema = z.object({
    body: z.object({
        employeeId: z.string().optional(),
        date: z.string().optional().transform((str) => str ? new Date(str) : new Date()),
        correctionReason: z.string().optional(),
    }),
});

export const checkOutSchema = z.object({
    body: z.object({
        employeeId: z.string().optional(),
        date: z.string().optional().transform((str) => str ? new Date(str) : new Date()),
        correctionReason: z.string().optional(),
    }),
});

export const correctAttendanceSchema = z.object({
    body: z.object({
        checkIn: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        checkOut: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        workedHours: z.number().optional(),
        status: z.nativeEnum(AttendanceStatus).optional(),
        correctionReason: z.string().min(1, 'Correction reason is required'),
    }),
});
