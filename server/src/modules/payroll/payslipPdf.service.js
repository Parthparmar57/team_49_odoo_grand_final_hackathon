import PDFDocument from 'pdfkit';

export class PayslipPdfService {
    static generatePayslipPdf(payslip) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', (buffer) => buffers.push(buffer));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                const ref = payslip.payslipRef || payslip.id;

                // Header
                doc.fontSize(20).text('PeoplePay360 HR & Payroll', { align: 'center' });
                doc.fontSize(14).text(`PAYSLIP - ${payslip.payslipRef}`, { align: 'center' });
                doc.moveDown();

                // Employee Info
                doc.fontSize(10);
                doc.text(`Employee Name: ${payslip.employee?.firstName || ''} ${payslip.employee?.lastName || ''}`);
                doc.text(`Employee Number: ${payslip.employee?.employeeNumber || 'N/A'}`);
                doc.text(`Period: ${new Date(payslip.periodStart).toLocaleDateString()} to ${new Date(payslip.periodEnd).toLocaleDateString()}`);
                doc.text(`Contract Ref: ${payslip.contract?.contractRef || 'N/A'}`);
                doc.text(`Worked Days: ${payslip.workedDays || 0} | Leave Days: ${payslip.leaveDays || 0}`);
                doc.moveDown();

                // Table Header
                doc.fontSize(11).text('Salary Computation Breakdown:', { underline: true });
                doc.moveDown(0.5);

                if (payslip.lines && payslip.lines.length > 0) {
                    payslip.lines.forEach((line) => {
                        doc.text(`${line.code} - ${line.name} (${line.category}): $${Number(line.amount || 0).toFixed(2)}`);
                    });
                }
                doc.moveDown();

                // Totals
                doc.fontSize(12).text(`Gross Salary: $${payslip.grossSalary.toFixed(2)}`, { align: 'right' });
                doc.text(`Total Deductions: $${payslip.totalDeductions.toFixed(2)}`, { align: 'right' });
                doc.fontSize(14).text(`NET SALARY: $${payslip.netSalary.toFixed(2)}`, { align: 'right', bold: true });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
