import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';

const PORT = env.PORT || 5000;

async function startServer() {
    try {
        logger.info('Verifying PostgreSQL database connection...');
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        logger.info('✅ PostgreSQL database connection verified successfully.');

        app.listen(PORT, () => {
            logger.info(`🚀 PeoplePay360 Express Server (Phase 1) running on port ${PORT} [${env.NODE_ENV}]`);
            logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        logger.error('❌ Failed to connect to database or start server:', error.message);
        process.exit(1);
    }
}

startServer();
