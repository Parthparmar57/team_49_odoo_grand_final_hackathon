import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export class PdfService {
    static async generatePayslipPdf(payslipId) {
        const payslip = await prisma.payslip.findUnique({
            where: { id: payslipId },
            include: {
                employee: { include: { department: true } },
                contract: true,
                payrun: true,
                lines: true,
            },
        });

        if (!payslip) throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('PeoplePay360 HR & Payroll', { align: 'center' });
            doc.fontSize(12).text('CONFIDENTIAL SALARY PAYSLIP', { align: 'center' });
            doc.moveDown();

            // Employee Info Box
            doc.fontSize(10).text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName} (${payslip.employee.employeeNumber})`);
            doc.text(`Department: ${payslip.employee.department?.name || 'N/A'}`);
            doc.text(`Pay Period: ${payslip.periodStart.toISOString().split('T')[0]} to ${payslip.periodEnd.toISOString().split('T')[0]}`);
            doc.text(`Bank Account: ${payslip.employee.bankName || 'N/A'} - ${payslip.employee.accountNumber || 'N/A'}`);
            doc.moveDown();

            doc.text('---------------------------------------------------------------------------------');
            doc.text('Earnings & Deductions Summary');
            doc.text('---------------------------------------------------------------------------------');

            for (const line of payslip.lines) {
                doc.text(`${line.code.padEnd(10)} | ${line.name.padEnd(30)} | ₹${Number(line.amount).toFixed(2)}`);
            }

            doc.text('---------------------------------------------------------------------------------');
            doc.fontSize(12).text(`Gross Salary: ₹${Number(payslip.grossSalary).toFixed(2)}`);
            doc.text(`Total Deductions: ₹${Number(payslip.totalDeductions).toFixed(2)}`);
            doc.fontSize(14).text(`NET SALARY PAID: ₹${Number(payslip.netSalary).toFixed(2)}`, { underline: true });
            doc.moveDown();

            doc.fontSize(8).text('Generated automatically by PeoplePay360 Backend System.', { align: 'center' });
            doc.end();
        });
    }
}
