import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } },
});
app.use('/api', limiter);

// GET /api/health - Verifies Express server and PostgreSQL database status
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({
            success: true,
            data: {
                server: 'ok',
                database: 'ok',
            },
        });
    } catch (error) {
        return res.status(503).json({
            success: false,
            data: {
                server: 'ok',
                database: 'error',
            },
            error: {
                code: 'DATABASE_UNAVAILABLE',
                message: 'PostgreSQL database connection failed',
            },
        });
    }
});

// Mount All Modular API Routers
app.use('/api', apiRouter);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
