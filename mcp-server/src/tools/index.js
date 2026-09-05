import { PrismaClient, LeaveRequestStatus, PayrunStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const mcpTools = [
    {
        name: 'get_unread_emails',
        description: 'Fetches unread emails for leave request processing.',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => [
            {
                messageId: 'msg_001',
                senderEmail: 'rahul@example.com',
                subject: 'Sick Leave Request for 2 days',
                body: 'Hi HR, I am feeling unwell and need sick leave from 2026-09-08 to 2026-09-09. Thanks, Rahul.',
            },
        ],
    },
    {
        name: 'get_employee_by_email',
        description: 'Retrieves employee record and active contract by email address.',
        inputSchema: { type: 'object', properties: { email: { type: 'string' } } },
        handler: async (args) => {
            const employee = await prisma.employee.findUnique({
                where: { email: args.email },
                include: { department: true, schedule: true, contracts: { where: { status: 'ACTIVE' } } },
            });
            return employee || { error: 'Employee not found' };
        },
    },
    {
        name: 'get_leave_balance',
        description: 'Retrieves leave allocations and remaining balances for an employee.',
        inputSchema: { type: 'object', properties: { employeeId: { type: 'string' } } },
        handler: async (args) => {
            return prisma.leaveAllocation.findMany({
                where: { employeeId: args.employeeId },
                include: { leaveType: true },
            });
        },
    },
    {
        name: 'create_leave_request',
        description: 'Creates a PENDING leave request requiring HR approval (NEVER auto-approves).',
        inputSchema: {
            type: 'object',
            properties: {
                employeeId: { type: 'string' },
                leaveTypeId: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                reason: { type: 'string' },
            },
        },
        handler: async (args) => {
            const start = new Date(args.startDate);
            const end = new Date(args.endDate);
            const duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const leave = await prisma.leaveRequest.create({
                data: {
                    employeeId: args.employeeId,
                    leaveTypeId: args.leaveTypeId,
                    startDate: start,
                    endDate: end,
                    duration,
                    reason: args.reason || 'Created via MCP Tool',
                    status: LeaveRequestStatus.PENDING,
                    source: 'EMAIL_AI',
                },
            });
            return { success: true, leaveRequest: leave, message: 'PENDING request created for HR approval.' };
        },
    },
];
