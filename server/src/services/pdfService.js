import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { PayslipPdfService } from '../modules/payroll/payslipPdf.service.js';

export class PdfService {
    static async generatePayslipPdf(payslipId) {
        const payslip = await prisma.payslip.findUnique({
            where: { id: payslipId },
            include: {
                employee: { include: { department: true } },
                contract: true,
                payrun: true,
                lines: { orderBy: { sequence: 'asc' } },
            },
        });

        if (!payslip) {
            throw new AppError('Payslip not found', 404, 'PAYSLIP_NOT_FOUND');
        }

        return PayslipPdfService.generatePayslipPdf(payslip);
    }
}
