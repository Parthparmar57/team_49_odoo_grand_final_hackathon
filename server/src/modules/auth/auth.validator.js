import { z } from 'zod';
import { Role } from '@prisma/client';

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
