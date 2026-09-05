import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Health check helper to verify database connection and auto-reconnect if idle PgBouncer pooler closed socket
 */
export async function ensurePrismaConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
        if (err?.message?.includes('Closed') || err?.message?.includes('kind: Closed') || err?.code === 'P1001') {
            console.warn('[Prisma] PostgreSQL connection closed by serverless pooler. Reconnecting...');
            await prisma.$connect();
        }
    }
}
