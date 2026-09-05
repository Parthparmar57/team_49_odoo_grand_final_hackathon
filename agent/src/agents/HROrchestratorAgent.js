import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient, LeaveRequestStatus, LeaveSource } from '@prisma/client';

const prisma = new PrismaClient();

export class EmailIngestionAgent {
    static async process(input) {
        return {
            messageId: input.messageId,
            senderEmail: input.senderEmail.toLowerCase().trim(),
            subject: input.subject.trim(),
            body: input.body.trim(),
            receivedAt: input.receivedAt || new Date().toISOString(),
            status: 'INGESTED',
        };
    }
}

export class LeaveExtractionAgent {
    static async extract(body, subject) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey && apiKey !== 'mock-gemini-key') {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `Extract leave request details from this email. Return ONLY a JSON object with leaveType, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), reason, confidence. Subject: ${subject} Body: ${body}`;
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (err) {
                console.warn('Gemini fallback:', err.message);
            }
        }

        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() + 3);
        const end = new Date(start);
        end.setDate(end.getDate() + 2);

        let leaveType = 'Annual Leave';
        if (/casual/i.test(body) || /casual/i.test(subject)) leaveType = 'Casual Leave';
        if (/sick/i.test(body) || /sick/i.test(subject)) leaveType = 'Sick Leave';

        return {
            leaveType,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            reason: body.slice(0, 100),
            confidence: 0.85,
        };
    }
}

export class EmployeeValidationAgent {
    static async validate(senderEmail, leaveTypeName, startDateStr, endDateStr) {
        const employee = await prisma.employee.findUnique({
            where: { email: senderEmail },
            include: { department: true, schedule: true, contracts: { where: { status: 'ACTIVE' } } },
        });

        if (!employee) {
            return { isValid: false, error: `Employee ${senderEmail} not found.`, code: 'EMPLOYEE_NOT_FOUND' };
        }

        const leaveType = await prisma.leaveType.findFirst({
            where: { name: { contains: leaveTypeName, mode: 'insensitive' }, active: true },
        });

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const resolvedLeaveType = leaveType || (await prisma.leaveType.findFirst({ where: { active: true } }));

        const overlap = await prisma.leaveRequest.findFirst({
            where: {
                employeeId: employee.id,
                status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
                startDate: { lte: end },
                endDate: { gte: start },
            },
        });

        if (overlap) {
            return { isValid: false, error: 'Overlapping leave request exists.', code: 'OVERLAPPING_LEAVE' };
        }

        return { isValid: true, employee, leaveType: resolvedLeaveType, startDate: start, endDate: end };
    }
}

export class HumanApprovalAgent {
    static async createPendingRequest(params) {
        const diffTime = Math.abs(params.endDate.getTime() - params.startDate.getTime());
        const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: params.employeeId,
                leaveTypeId: params.leaveTypeId,
                startDate: params.startDate,
                endDate: params.endDate,
                duration,
                reason: params.reason || 'AI Email Ingestion',
                status: LeaveRequestStatus.PENDING,
                source: LeaveSource.EMAIL_AI,
                emailId: params.emailId,
            },
            include: { leaveType: true, employee: true },
        });

        return { leaveRequest, requiresHumanApproval: true };
    }
}

export class HROrchestratorAgent {
    static async runLeaveEmailWorkflow(email) {
        const startTime = Date.now();
        const requestId = `req_ai_${Date.now()}`;

        try {
            const ingested = await EmailIngestionAgent.process(email);
            const extracted = await LeaveExtractionAgent.extract(email.body, email.subject);
            const validation = await EmployeeValidationAgent.validate(
                email.senderEmail,
                extracted.leaveType,
                extracted.startDate,
                extracted.endDate
            );

            if (!validation.isValid) {
                await prisma.aIExecution.create({
                    data: {
                        requestId,
                        agent: 'Leave Validation Agent',
                        intent: 'EMAIL_LEAVE_VALIDATION',
                        status: 'FAILED',
                        toolNames: ['get_employee_by_email'],
                        resultSummary: `Validation failed: ${validation.error}`,
                        requiresHumanApproval: false,
                        executionTimeMs: Date.now() - startTime,
                        metadata: { error: validation.error },
                    },
                });
                return { success: false, error: validation.error };
            }

            const approval = await HumanApprovalAgent.createPendingRequest({
                employeeId: validation.employee.id,
                leaveTypeId: validation.leaveType.id,
                startDate: validation.startDate,
                endDate: validation.endDate,
                reason: extracted.reason,
                emailId: email.messageId,
            });

            await prisma.aIExecution.create({
                data: {
                    requestId,
                    agent: 'HR Orchestrator Multi-Agent System',
                    intent: 'EMAIL_LEAVE_PROCESSING',
                    status: 'SUCCESS',
                    toolNames: ['get_employee_by_email', 'create_leave_request'],
                    resultSummary: `Created PENDING leave request #${approval.leaveRequest.id} for ${validation.employee.firstName} ${validation.employee.lastName}. Requires HR approval.`,
                    requiresHumanApproval: true,
                    executionTimeMs: Date.now() - startTime,
                    metadata: { leaveRequestId: approval.leaveRequest.id },
                },
            });

            return { success: true, leaveRequest: approval.leaveRequest };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}
