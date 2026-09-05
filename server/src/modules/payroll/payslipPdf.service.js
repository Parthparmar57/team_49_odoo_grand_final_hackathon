import PDFDocument from 'pdfkit';

export class PayslipPdfService {
    static generatePayslipPdf(payslip) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: 'A4' });
                const buffers = [];

                doc.on('data', (buffer) => buffers.push(buffer));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                doc.on('error', (err) => reject(err));

                // Color Palette
                const PRIMARY = '#0F172A'; // Slate 900
                const ACCENT = '#FF5E1E';  // PeoplePay360 Orange
                const SECONDARY = '#2563EB'; // Royal Blue
                const TEXT_DARK = '#1E293B'; // Slate 800
                const TEXT_MUTED = '#64748B'; // Slate 500
                const BG_LIGHT = '#F8FAFC'; // Slate 50
                const BORDER_COLOR = '#E2E8F0'; // Slate 200
                const SUCCESS_COLOR = '#16A34A'; // Green 600

                const pageWidth = 515; // A4 width 595 - 2*40
                const startX = 40;
                let currentY = 40;

                // 1. BRAND HEADER BANNER
                doc.rect(startX, currentY, pageWidth, 60).fill(PRIMARY);

                // Brand Name & Tagline
                doc.font('Helvetica-Bold').fontSize(20).fillColor('#FFFFFF').text('PeoplePay360', startX + 15, currentY + 14);
                doc.font('Helvetica').fontSize(9).fillColor('#94A3B8').text('AI-Powered HR & Payroll Automation Platform', startX + 15, currentY + 37);

                // Payslip Title & Status Badge on Right
                doc.font('Helvetica-Bold').fontSize(14).fillColor(ACCENT).text('SALARY PAYSLIP', startX + 320, currentY + 14, { width: 180, align: 'right' });
                const refText = payslip.payslipRef || `PS-${payslip.id ? payslip.id.slice(-6) : '0000'}`;
                doc.font('Helvetica').fontSize(9).fillColor('#E2E8F0').text(`Ref: ${refText}`, startX + 320, currentY + 34, { width: 180, align: 'right' });

                currentY += 75;

                // 2. EMPLOYEE & PAY PERIOD TWO-COLUMN METADATA GRID
                const emp = payslip.employee || {};
                const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const empNo = emp.employeeNumber || 'N/A';
                const deptName = emp.department?.name || payslip.contract?.department?.name || 'General Operations';
                const designation = emp.designation || 'Staff Member';
                const startDateStr = payslip.periodStart ? new Date(payslip.periodStart).toISOString().split('T')[0] : 'N/A';
                const endDateStr = payslip.periodEnd ? new Date(payslip.periodEnd).toISOString().split('T')[0] : 'N/A';
                const contractRef = payslip.contract?.contractRef || 'Standard Employment Contract';
                const bankName = emp.bankName || 'HDFC Bank';
                const accountNumber = emp.accountNumber || '••••••••' + (emp.id ? emp.id.slice(-4) : '1234');

                // Metadata Box Frame
                const boxHeight = 90;
                doc.rect(startX, currentY, pageWidth, boxHeight).fillAndStroke(BG_LIGHT, BORDER_COLOR);

                // Box Header Bar
                doc.rect(startX, currentY, pageWidth, 20).fill(BORDER_COLOR);
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK).text('EMPLOYEE & PAY PERIOD DETAILS', startX + 10, currentY + 5);

                const col1X = startX + 12;
                const col2X = startX + 270;
                let metaY = currentY + 28;

                // Column 1 Details
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_MUTED).text('Employee Name:', col1X, metaY);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(empName, col1X + 90, metaY);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Employee ID:', col1X, metaY + 16);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(empNo, col1X + 90, metaY + 16);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Department:', col1X, metaY + 32);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(deptName, col1X + 90, metaY + 32);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Designation:', col1X, metaY + 48);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(designation, col1X + 90, metaY + 48);

                // Column 2 Details
                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Pay Period:', col2X, metaY);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(`${startDateStr} to ${endDateStr}`, col2X + 85, metaY);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Contract Ref:', col2X, metaY + 16);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(contractRef, col2X + 85, metaY + 16);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Bank Account:', col2X, metaY + 32);
                doc.font('Helvetica').fillColor(TEXT_DARK).text(`${bankName} (${accountNumber})`, col2X + 85, metaY + 32);

                doc.font('Helvetica-Bold').fillColor(TEXT_MUTED).text('Payment Status:', col2X, metaY + 48);
                const statusText = payslip.status || 'PAID';
                doc.font('Helvetica-Bold').fillColor(statusText === 'PAID' ? SUCCESS_COLOR : SECONDARY).text(statusText, col2X + 85, metaY + 48);

                currentY += boxHeight + 20;

                // 3. SALARY COMPUTATION BREAKDOWN TABLE
                doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY).text('Salary Computation Breakdown', startX, currentY);
                currentY += 16;

                // Table Header Row
                const tableHeaderHeight = 22;
                doc.rect(startX, currentY, pageWidth, tableHeaderHeight).fill(PRIMARY);

                doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
                doc.text('CODE', startX + 10, currentY + 6, { width: 70 });
                doc.text('PAY COMPONENT DESCRIPTION', startX + 90, currentY + 6, { width: 230 });
                doc.text('CATEGORY', startX + 320, currentY + 6, { width: 90 });
                doc.text('AMOUNT (INR)', startX + 410, currentY + 6, { width: 95, align: 'right' });

                currentY += tableHeaderHeight;

                // Table Data Rows
                const lines = payslip.lines && payslip.lines.length > 0 ? payslip.lines : [
                    { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', amount: payslip.basicSalary || payslip.grossSalary || 0 },
                    { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', amount: payslip.totalAllowances || 0 },
                    { code: 'DED_TAX', name: 'Income Tax & Statutory Deduction', category: 'DEDUCTION', amount: payslip.totalDeductions || 0 }
                ];

                lines.forEach((line, index) => {
                    const rowHeight = 22;
                    const bg = index % 2 === 0 ? '#FFFFFF' : BG_LIGHT;
                    doc.rect(startX, currentY, pageWidth, rowHeight).fillAndStroke(bg, BORDER_COLOR);

                    const amtFormatted = `₹ ${Number(line.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT_DARK).text(line.code || 'LINE', startX + 10, currentY + 6, { width: 70 });
                    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_DARK).text(line.name || 'Allowance/Deduction', startX + 90, currentY + 6, { width: 230 });

                    // Category Badge Style
                    const cat = line.category || 'ALLOWANCE';
                    let catColor = SECONDARY;
                    if (cat === 'BASIC') catColor = '#0F172A';
                    if (cat === 'DEDUCTION') catColor = '#DC2626';
                    if (cat === 'ALLOWANCE') catColor = '#D97706';

                    doc.font('Helvetica-Bold').fontSize(8).fillColor(catColor).text(cat, startX + 320, currentY + 6, { width: 90 });
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cat === 'DEDUCTION' ? '#DC2626' : TEXT_DARK).text(amtFormatted, startX + 410, currentY + 6, { width: 95, align: 'right' });

                    currentY += rowHeight;
                });

                currentY += 15;

                // 4. FINANCIAL SUMMARY BOX (GROSS, DEDUCTIONS, NET PAYABLE)
                const summaryBoxHeight = 85;
                const summaryBoxWidth = 260;
                const summaryX = startX + (pageWidth - summaryBoxWidth);

                doc.rect(summaryX, currentY, summaryBoxWidth, summaryBoxHeight).fillAndStroke(BG_LIGHT, BORDER_COLOR);

                const grossVal = `₹ ${Number(payslip.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const dedVal = `₹ ${Number(payslip.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const netVal = `₹ ${Number(payslip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                let sumY = currentY + 10;

                doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED).text('Gross Earnings:', summaryX + 15, sumY);
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK).text(grossVal, summaryX + 120, sumY, { width: 125, align: 'right' });

                sumY += 18;
                doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED).text('Total Deductions:', summaryX + 15, sumY);
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#DC2626').text(dedVal, summaryX + 120, sumY, { width: 125, align: 'right' });

                sumY += 18;
                doc.moveTo(summaryX + 10, sumY).lineTo(summaryX + summaryBoxWidth - 10, sumY).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
                sumY += 8;

                doc.font('Helvetica-Bold').fontSize(11).fillColor(PRIMARY).text('NET SALARY PAID:', summaryX + 15, sumY);
                doc.font('Helvetica-Bold').fontSize(12).fillColor(SUCCESS_COLOR).text(netVal, summaryX + 120, sumY, { width: 125, align: 'right' });

                // Left Note Box
                const noteBoxWidth = pageWidth - summaryBoxWidth - 20;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(PRIMARY).text('Notes & Compliance Notice', startX, currentY + 5);
                doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED).text(
                    'This payslip is an official statement of your earnings and tax deductions for the specified pay period. Please retain this document for tax filing and financial records.',
                    startX,
                    currentY + 22,
                    { width: noteBoxWidth, lineGap: 3 }
                );

                currentY += summaryBoxHeight + 40;

                // 5. FOOTER STAMP
                doc.moveTo(startX, currentY).lineTo(startX + pageWidth, currentY).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
                currentY += 10;

                doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_MUTED).text('PeoplePay360 HR & Payroll Automation Platform', startX, currentY, { align: 'center' });
                doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94A3B8').text('This is a computer-generated document. No signature required.', startX, currentY + 12, { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
