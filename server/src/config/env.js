import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
    GEMINI_API_KEY: z.string().optional(),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid Environment Variables:', _env.error.format());
    throw new Error('Invalid Environment Variables');
}

export const env = _env.data;
