import { z } from 'zod';
import { FormulaEvaluator } from './formulaEvaluator.js';

export const createSalaryStructureSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        code: z.string().min(2, 'Code must be at least 2 characters'),
        description: z.string().optional(),
        active: z.boolean().default(true),
    }),
});

export const updateSalaryStructureSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        code: z.string().min(2).optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
    }),
});

export const createSalaryRuleSchema = z.object({
    body: z
        .object({
            name: z.string().min(2, 'Name must be at least 2 characters'),
            code: z.string().min(2, 'Code must be at least 2 characters'),
            category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']),
            sequence: z.number().int().min(1, 'Sequence must be a positive integer').default(10),
            computationMethod: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']).default('FIXED'),
            fixedAmount: z.number().nonnegative().optional(),
            amount: z.number().nonnegative().optional(),
            percentage: z.number().min(0).max(100).optional(),
            percentageBasedOn: z.string().optional(),
            formula: z.string().optional(),
            active: z.boolean().default(true),
        })
        .refine(
            (data) => {
                if (data.computationMethod === 'FIXED') {
                    return (data.fixedAmount !== undefined && data.fixedAmount >= 0) || (data.amount !== undefined && data.amount >= 0);
                }
                if (data.computationMethod === 'PERCENTAGE') {
                    return data.percentage !== undefined && data.percentage >= 0;
                }
                if (data.computationMethod === 'FORMULA') {
                    if (!data.formula) return false;
                    try {
                        FormulaEvaluator.validateFormula(data.formula);
                        return true;
                    } catch (e) {
                        return false;
                    }
                }
                return true;
            },
            {
                message: 'Invalid configuration for selected computation method (FIXED requires fixedAmount, PERCENTAGE requires percentage, FORMULA requires valid safe formula)',
                path: ['computationMethod'],
            }
        ),
});

export const updateSalaryRuleSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        code: z.string().min(2).optional(),
        category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']).optional(),
        sequence: z.number().int().min(1).optional(),
        computationMethod: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']).optional(),
        fixedAmount: z.number().nonnegative().optional(),
        amount: z.number().nonnegative().optional(),
        percentage: z.number().min(0).max(100).optional(),
        percentageBasedOn: z.string().optional(),
        formula: z.string().optional(),
        active: z.boolean().optional(),
    }),
});

export const createPayrunSchema = z.object({
    body: z
        .object({
            name: z.string().optional(),
            salaryStructureId: z.string().min(1, 'Salary structure ID is required'),
            periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
            periodEnd: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        })
        .refine(
            (data) => {
                const start = new Date(data.periodStart);
                const end = new Date(data.periodEnd);
                return start <= end;
            },
            {
                message: 'Period end date must be on or after period start date',
                path: ['periodEnd'],
            }
        ),
});
