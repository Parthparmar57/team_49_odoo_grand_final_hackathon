import dotenv from 'dotenv';
import { emailWorker, payslipWorker } from './queues/emailWorker.js';

dotenv.config();

console.log('⚡ PeoplePay360 Background Worker Service (JavaScript) initialized.');

emailWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} in emailQueue completed successfully.`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} in emailQueue failed: ${err.message}`);
});

payslipWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} in payslipQueue completed successfully.`);
});
