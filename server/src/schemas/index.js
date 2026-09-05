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
        employeeNumber: z.string().min(2, 'Employee ID must be at least 2 characters').max(30),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Must be a valid email address'),
        phone: z.string().optional().refine(
            (val) => {
                if (!val) return true;
                const clean = val.replace(/[\s\-\+\(\)]/g, '');
                return /^[6-9]\d{9}$/.test(clean) || /^\d{10}$/.test(clean);
            },
            { message: 'Phone number must contain exactly 10 digits (e.g. 9876543210)' }
        ),
        designation: z.string().min(1, 'Designation is required'),
        joiningDate: z.string().transform((str) => new Date(str)),
        employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
        status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
        bankName: z.string().optional(),
        accountNumber: z.string().optional().refine(
            (val) => !val || /^\d{9,18}$/.test(val.trim()),
            { message: 'Bank Account Number must contain only digits (9 to 18 numbers)' }
        ),
        ifscCode: z.string().optional().refine(
            (val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(val.trim()),
            { message: 'IFSC Code must be an 11-character code (e.g. SBIN0001234)' }
        ),
        pinCode: z.string().optional().refine(
            (val) => !val || /^\d{6}$/.test(val.trim()),
            { message: 'PIN code must contain exactly 6 digits (e.g. 380001)' }
        ),
        taxId: z.string().optional().refine(
            (val) => !val || /^[A-Z0-9]{5,15}$/i.test(val.trim()),
            { message: 'Tax ID / PAN must be 5 to 15 alphanumeric characters' }
        ),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        departmentId: z.string().min(1, 'Department ID is required'),
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
        contractRef: z.string().min(2, 'Contract reference must be at least 2 characters'),
        employeeId: z.string().optional(),
        departmentId: z.string().optional(),
        scheduleId: z.string().optional(),
        salaryStructureId: z.string().optional(),
        wage: z.number({ invalid_type_error: 'Wage must be a positive number' }).positive('Wage must be greater than zero'),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        status: z.nativeEnum(ContractStatus).default(ContractStatus.ACTIVE),
        notes: z.string().optional(),
    }).refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.endDate >= data.startDate;
            }
            return true;
        },
        { message: 'End date cannot be earlier than start date', path: ['endDate'] }
    ),
});

export const updateContractSchema = z.object({
    body: z.object({
        contractRef: z.string().min(2).optional(),
        employeeId: z.string().optional(),
        departmentId: z.string().optional(),
        scheduleId: z.string().optional(),
        salaryStructureId: z.string().optional(),
        wage: z.number().positive().optional(),
        startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
        status: z.nativeEnum(ContractStatus).optional(),
        notes: z.string().optional(),
    }),
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
