import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
        user: process.env.SMTP_USER || 'demo@peoplepay360.com',
        pass: process.env.SMTP_PASS || 'demopass',
    },
});

export const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        console.log(`[EmailWorker] Processing job ${job.id} of type ${job.name}`);
        const { to, subject, body, html } = job.data;

        try {
            if (process.env.NODE_ENV === 'test') {
                console.log(`[Mock Email Sent] To: ${to}, Subject: ${subject}`);
                return { delivered: true, mock: true };
            }

            const info = await transporter.sendMail({
                from: '"PeoplePay360 HR" <noreply@peoplepay360.com>',
                to,
                subject,
                text: body,
                html: html || `<p>${body}</p>`,
            });

            return { delivered: true, messageId: info.messageId };
        } catch (err) {
            console.error(`[EmailWorker] Error sending email for job ${job.id}:`, err);
            throw err;
        }
    },
    { connection, concurrency: 5 }
);

export const payslipWorker = new Worker(
    'payslipQueue',
    async (job) => {
        console.log(`[PayslipWorker] Processing payslip generation job ${job.id} for payslipId ${job.data.payslipId}`);
        return { success: true, payslipId: job.data.payslipId, deliveredAt: new Date().toISOString() };
    },
    { connection }
);
