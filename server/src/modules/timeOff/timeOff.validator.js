import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        code: z.string().min(2, 'Code must be at least 2 characters'),
        unit: z.enum(['DAYS', 'HOURS']).default('DAYS'),
        requiresAllocation: z.boolean().default(true),
        approvalRequired: z.boolean().default(true),
        allowNegativeBalance: z.boolean().default(false),
        payrollImpact: z.boolean().default(true),
        description: z.string().optional(),
        active: z.boolean().default(true),
    }),
});

export const updateLeaveTypeSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        code: z.string().min(2).optional(),
        unit: z.enum(['DAYS', 'HOURS']).optional(),
        requiresAllocation: z.boolean().optional(),
        approvalRequired: z.boolean().optional(),
        allowNegativeBalance: z.boolean().optional(),
        payrollImpact: z.boolean().optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
    }),
});

export const createAllocationSchema = z.object({
    body: z.object({
        employeeId: z.string().min(1, 'Invalid employee ID'),
        leaveTypeId: z.string().min(1, 'Invalid leave type ID'),
        allocatedAmount: z.number().positive('Allocated amount must be positive'),
        periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        periodEnd: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    }),
});

export const updateAllocationSchema = z.object({
    body: z.object({
        allocatedAmount: z.number().positive().optional(),
        usedAmount: z.number().nonnegative().optional(),
        periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        periodEnd: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    }),
});

export const createLeaveRequestSchema = z.object({
    body: z.object({
        employeeId: z.string().min(1, 'Invalid employee ID').optional(),
        leaveTypeId: z.string().min(1, 'Invalid leave type ID'),
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        reason: z.string().optional(),
    }),
});

export const updateLeaveRequestSchema = z.object({
    body: z.object({
        startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
        leaveTypeId: z.string().min(1).optional(),
        reason: z.string().optional(),
    }),
});

export const refuseLeaveRequestSchema = z.object({
    body: z.object({
        rejectionReason: z.string().min(3, 'Refusal reason must be at least 3 characters long'),
    }),
});

export const cancelLeaveRequestSchema = z.object({
    body: z.object({
        cancellationReason: z.string().optional(),
    }).optional(),
});
