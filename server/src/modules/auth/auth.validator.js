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
        email: z.string().email('Please enter a valid work email'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Please enter a valid work email'),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        verificationCode: z.string().optional(),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
    }),
});

export const adminCreateUserSchema = z.object({
    body: z.object({
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
        role: z.nativeEnum(Role),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        employeeId: z.string().optional().nullable(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
    }),
});

