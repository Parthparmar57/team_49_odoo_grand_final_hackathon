import PDFDocument from 'pdfkit';

export class PayslipPdfService {
    static generatePayslipPdf(payslip) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const buffers = [];

                doc.on('data', (buffer) => buffers.push(buffer));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', (err) => reject(err));

                const emp = payslip.employee || {};
                const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const empNo = emp.employeeNumber || 'N/A';
                const deptName = emp.department?.name || payslip.contract?.department?.name || 'General';
                const startDateStr = payslip.periodStart ? new Date(payslip.periodStart).toISOString().split('T')[0] : 'N/A';
                const endDateStr = payslip.periodEnd ? new Date(payslip.periodEnd).toISOString().split('T')[0] : 'N/A';

                // Header
                doc.font('Helvetica-Bold').fontSize(22).fillColor('#1e293b').text('PeoplePay360', { align: 'center' });
                doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('HR & Payroll Management System', { align: 'center' });
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#2563eb').text(`SALARY PAYSLIP - ${payslip.payslipRef || payslip.id}`, { align: 'center' });
                doc.moveDown(1);

                // Divider line
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
                doc.moveDown(1);

                // Employee & Pay Details Block
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Employee & Pay Period Details:');
                doc.moveDown(0.5);

                doc.font('Helvetica').fontSize(10).fillColor('#334155');
                doc.text(`Employee Name: ${empName}`);
                doc.text(`Employee ID: ${empNo}`);
                doc.text(`Department: ${deptName}`);
                doc.text(`Pay Period: ${startDateStr} to ${endDateStr}`);
                if (payslip.contract?.contractRef) {
                    doc.text(`Contract Reference: ${payslip.contract.contractRef}`);
                }
                doc.moveDown(1);

                // Divider line
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
                doc.moveDown(1);

                // Salary Computation Breakdown
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Salary Computation Breakdown:');
                doc.moveDown(0.5);

                if (payslip.lines && payslip.lines.length > 0) {
                    payslip.lines.forEach((line) => {
                        const amountVal = Number(line.amount || 0).toFixed(2);
                        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(
                            `${(line.code || '').padEnd(12)} ${(line.name || '').padEnd(30)} [${line.category || 'LINE'}]`
                        );
                        doc.font('Helvetica-Bold').text(`₹ ${amountVal}`, { align: 'right' });
                        doc.moveDown(0.2);
                    });
                } else {
                    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#94a3b8').text('No salary breakdown lines recorded.');
                }
                doc.moveDown(1);

                // Divider line
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cbd5e1').lineWidth(1).stroke();
                doc.moveDown(1);

                // Summary Totals
                const grossVal = Number(payslip.grossSalary || 0).toFixed(2);
                const dedVal = Number(payslip.totalDeductions || 0).toFixed(2);
                const netVal = Number(payslip.netSalary || 0).toFixed(2);

                doc.font('Helvetica').fontSize(11).fillColor('#334155').text(`Gross Salary: ₹ ${grossVal}`, { align: 'right' });
                doc.text(`Total Deductions: ₹ ${dedVal}`, { align: 'right' });
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#16a34a').text(`NET SALARY PAID: ₹ ${netVal}`, { align: 'right' });

                doc.moveDown(2);
                doc.font('Helvetica-Oblique').fontSize(8).fillColor('#94a3b8').text('This is a system-generated document from PeoplePay360. No signature required.', { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
