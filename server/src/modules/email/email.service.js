import { prisma } from '../../config/prisma.js';

export class EmailService {
    static async processInboundEmail(data) {
        const { from, to, subject, body, messageId } = data;

        const employee = await prisma.employee.findUnique({
            where: { email: from },
        });

        const emailRecord = await prisma.email.create({
            data: {
                messageId: messageId || `MSG-${Date.now()}`,
                from,
                to: to || 'hr@peoplepay360.com',
                subject: subject || 'No Subject',
                body: body || '',
                employeeId: employee?.id,
                status: 'RECEIVED',
            },
        });

        return {
            email: emailRecord,
            matchedEmployee: employee
                ? {
                    id: employee.id,
                    name: `${employee.firstName} ${employee.lastName}`,
                    email: employee.email,
                }
                : null,
            workflowTriggered: Boolean(employee),
        };
    }

    static async getLogs(query = {}) {
        const { limit = 20, page = 1 } = query;
        const take = Number(limit);
        const skip = (Number(page) - 1) * take;

        const [items, total] = await Promise.all([
            prisma.email.findMany({
                include: {
                    employee: {
                        select: { id: true, firstName: true, lastName: true, email: true, employeeNumber: true }
                    }
                },
                orderBy: { receivedAt: 'desc' },
                take,
                skip
            }),
            prisma.email.count()
        ]);

        return { items, total, page: Number(page), limit: take };
    }
}

