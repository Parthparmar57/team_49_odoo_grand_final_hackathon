# Solution Document — PeoplePay360

## 1. Executive Summary

PeoplePay360 is a modular HR and Payroll platform built around a connected operational data model and an AI-powered email-to-workflow leave automation layer.

The platform combines:

```text
HR Master Data
+
Attendance
+
Time Off
+
Payroll
+
AI Email Processing
+
Human Approval
+
Background Automation
+
Reporting
```

The core innovation is:

```text
EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION
```

Instead of forcing employees to fill a leave form, the system can understand a natural-language leave email, convert it into structured data, validate it, and create a pending request for HR.

---

# 2. Proposed Technology Stack

## Frontend

```text
React
Vite
TypeScript
Tailwind CSS
React Router
Zustand
TanStack Query
Axios
Lucide React
Recharts
```

### Responsibilities

- Employee UI.
- Admin/HR UI.
- Payroll UI.
- Leave management.
- Dashboards.
- Forms.
- Tables.
- Approval actions.

---

## Backend

```text
Node.js
Express.js
TypeScript
Prisma ORM
Zod
JWT
HTTP-only Cookies
bcrypt
```

### Responsibilities

- REST API.
- Authentication.
- Authorization.
- Business logic.
- Validation.
- Database access.
- Workflow triggers.
- Integration coordination.

---

## Database

```text
PostgreSQL
```

PostgreSQL stores durable business state.

---

## AI

```text
LangGraph.js
LangChain.js
Google Gemini
```

### Responsibilities

**LangGraph**

- Workflow orchestration.
- State management.
- Conditional routing.
- Human-review paths.

**LangChain**

- LLM integration.
- Structured output.
- Prompt/tool utilities.

**Gemini**

- Email classification.
- Natural-language understanding.
- Leave information extraction.

---

## Email

```text
Gmail API
MCP
```

Gmail API provides the actual email integration.

MCP exposes email capabilities as tools.

Example:

```text
get_unread_emails()
get_email()
search_emails()
mark_as_read()
send_email()
```

---

## Automation

```text
BullMQ
Redis
```

Used for:

- Background email delivery.
- Retry.
- Scheduling.
- Rate limiting.
- Failed-job tracking.
- Bulk processing.

---

## Infrastructure

```text
Docker
Git
GitHub
```

Local services:

```text
Frontend
Backend
PostgreSQL
Redis
Worker
MCP Server
```

---

# 3. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      EMPLOYEE       │
                         │                     │
                         │ Leave Email         │
                         │ Dashboard           │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
            ┌─────────────┐                   ┌──────────────┐
            │   GMAIL     │                   │  WEB CLIENT  │
            └──────┬──────┘                   └──────┬───────┘
                   │                                  │
               Gmail API                              │
                   │                                  │
                   ▼                                  ▼
            ┌─────────────────────────────────────────────┐
            │              NODE / EXPRESS API             │
            └────────────────────┬────────────────────────┘
                                 │
              ┌──────────────────┼───────────────────┐
              │                  │                   │
              ▼                  ▼                   ▼
        ┌───────────┐      ┌────────────┐      ┌─────────────┐
        │    MCP    │      │ PostgreSQL │      │  LangGraph  │
        │ Email Tool│      │            │      │   + Gemini  │
        └─────┬─────┘      └────────────┘      └─────────────┘
              │
              └──────────────────┐
                                 ▼
                          ┌──────────────┐
                          │ HR Dashboard │
                          └──────┬───────┘
                                 │
                            APPROVE /
                             REJECT
                                 │
                                 ▼
                          ┌──────────────┐
                          │ BullMQ Queue │
                          │    Redis     │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │ Email Worker │
                          └──────┬───────┘
                                 │
                                 ▼
                              MCP
                                 │
                                 ▼
                            Gmail API
                                 │
                                 ▼
                             Employee
```

---

# 4. Architectural Principles

## Principle 1 — AI Is Assistive

AI understands unstructured communication.

It does not make the final HR decision.

```text
AI → Extract / Validate
Human → Approve / Reject
System → Automate
```

---

## Principle 2 — PostgreSQL Is the Source of Truth

The database is authoritative for:

- Employees.
- Contracts.
- Leave balances.
- Leave requests.
- Attendance.
- Payroll.
- Payslips.
- Email logs.
- Audit records.

AI output is not persisted as truth until it passes application validation.

---

## Principle 3 — Background Work Is Asynchronous

Email sending and bulk operations should not block HTTP requests.

```text
API
 ↓
Create Job
 ↓
Queue
 ↓
Worker
 ↓
External Service
```

---

## Principle 4 — Business Rules Stay in Application Logic

Examples:

- Which contract applies to a payroll period?
- Is a leave allocation available?
- Which salary rules execute?
- Can a request be approved?
- Is a duplicate payslip being created?

These rules must not be hidden inside UI code or hardcoded mock data.

---

# 5. Backend Service Structure

Recommended project structure:

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── contracts/
│   │   ├── schedules/
│   │   ├── attendance/
│   │   ├── timeOff/
│   │   ├── payroll/
│   │   ├── payslips/
│   │   ├── dashboard/
│   │   └── email/
│   │
│   ├── ai/
│   │   ├── graph/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── integrations/
│   │   ├── gmail/
│   │   └── mcp/
│   │
│   ├── queues/
│   │   ├── email.queue.ts
│   │   └── email.worker.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   └── errorHandler.ts
│   │
│   ├── utils/
│   └── types/
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

# 6. Frontend Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── pages/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Employees/
│   │   ├── Contracts/
│   │   ├── Attendance/
│   │   ├── TimeOff/
│   │   ├── Payroll/
│   │   └── Reports/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── tables/
│   │   ├── forms/
│   │   ├── charts/
│   │   └── layout/
│   │
│   ├── features/
│   │   ├── employees/
│   │   ├── leave/
│   │   ├── payroll/
│   │   └── email/
│   │
│   ├── api/
│   ├── store/
│   ├── hooks/
│   └── types/
```

---

# 7. Database Architecture

## Core tables

```text
User
Employee
Department
Contract
WorkingSchedule
Attendance
TimeOffType
TimeOffAllocation
LeaveRequest
SalaryStructure
SalaryRule
Payrun
Payslip
PayslipLine
Email
EmailLog
AuditLog
```

## Central relationship

```text
Employee
  │
  ├── Department
  ├── Manager
  ├── WorkingSchedule
  ├── Contracts
  ├── Attendance
  ├── LeaveRequests
  ├── LeaveAllocations
  └── Payslips
```

---

# 8. AI Email Processing Architecture

## Step 1 — Ingestion

A worker periodically retrieves unread emails using Gmail integration.

```text
Gmail
 ↓
Gmail API
 ↓
MCP
 ↓
Email Ingestion Service
```

The system stores:

- Provider message ID.
- Sender.
- Recipient.
- Subject.
- Body.
- Received timestamp.
- Processing status.

---

## Step 2 — Duplicate Detection

```text
Provider Message ID
       ↓
Exists in Email table?
   ┌──────┴──────┐
  YES            NO
   ↓              ↓
 Ignore        Process
```

This protects against duplicate processing.

---

# 9. LangGraph Workflow

Recommended state:

```typescript
type LeaveEmailState = {
  messageId: string;
  senderEmail: string;
  subject: string;
  body: string;

  isLeaveRequest?: boolean;

  employeeId?: string;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  reason?: string;

  confidence?: number;

  validationErrors: string[];
  status: string;
};
```

## Graph

```text
START
 ↓
loadEmail
 ↓
classifyEmail
 ↓
 ┌─────────────────────┐
 │ Leave Request?      │
 └──────────┬──────────┘
        NO  │  YES
            │
            ▼
       findEmployee
            ↓
       extractLeave
            ↓
       validateLeave
            ↓
       ┌────┴───────────┐
       │ Valid?         │
       └────┬───────────┘
          NO│YES
            │
            ▼
       NEEDS_REVIEW   createRequest
                         ↓
                     notifyHR
                         ↓
                        END
```

---

# 10. Structured AI Output

Use a schema rather than trusting free-form model text.

Example:

```json
{
  "employeeEmail": "rahul@example.com",
  "startDate": "2026-09-10",
  "endDate": "2026-09-12",
  "leaveType": "Casual Leave",
  "reason": "Family function",
  "confidence": 0.94
}
```

Validate the model output using Zod before business processing.

---

# 11. Validation Layer

AI extraction is followed by deterministic application validation.

### Checks

1. Employee exists.
2. Employee is active.
3. Start date exists.
4. End date exists.
5. Start date is not after end date.
6. Leave type exists.
7. Requested duration is valid.
8. Allocation is available when required.
9. Duplicate request is not already present.
10. Request does not violate configured rules.

AI should never bypass these checks.

---

# 12. Human-in-the-Loop

If the system cannot confidently interpret the request:

```text
AI
 ↓
NEEDS_REVIEW
 ↓
HR edits missing fields
 ↓
HR submits
 ↓
PENDING
```

Example:

> “I need leave next Friday.”

The system should not guess blindly if the date cannot be resolved reliably.

---

# 13. Leave Approval Transaction

Approval should be transactional.

Conceptually:

```text
BEGIN TRANSACTION

1. Lock LeaveRequest
2. Verify status = PENDING
3. Re-check allocation
4. Update LeaveRequest
5. Consume allocation
6. Create AuditLog
7. Create notification job/outbox event

COMMIT
```

This avoids double approval and inconsistent leave balances.

---

# 14. Queue Architecture

Use separate queues if the application grows:

```text
email-notification
payslip-generation
payslip-delivery
ai-processing
```

For the MVP, one email queue can be sufficient.

## Email Job

```json
{
  "type": "LEAVE_APPROVAL",
  "employeeId": "emp_123",
  "recipient": "rahul@example.com",
  "template": "leave-approved",
  "leaveRequestId": "leave_456"
}
```

The worker should load the current database state before sending where appropriate.

---

# 15. Retry Strategy

Example:

```text
Attempt 1
   ↓
Failure
   ↓
Delay
   ↓
Attempt 2
   ↓
Failure
   ↓
Delay
   ↓
Attempt 3
   ↓
Failed / Dead Letter
```

EmailLog should capture:

- Job ID.
- Recipient.
- Type.
- Status.
- Attempts.
- Error.
- Sent timestamp.

---

# 16. Payroll Engine

Payroll should be deterministic.

## Inputs

```text
Employee
+
Applicable Contract
+
Payrun Period
+
Salary Structure
+
Salary Rules
+
Attendance/Leave context
```

## Processing

```text
Resolve Contract
      ↓
Load Salary Structure
      ↓
Sort Rules by Sequence
      ↓
Execute Rule 1
      ↓
Execute Rule 2
      ↓
...
      ↓
Calculate Gross
      ↓
Calculate Deductions
      ↓
Calculate Net
      ↓
Create Payslip
```

---

# 17. Salary Rule Engine

Example:

```text
Rule 10 → Basic = 40,000
Rule 20 → Housing = 20% of Basic
Rule 30 → Transport = 2,000
Rule 40 → Gross = Basic + Housing + Transport
Rule 50 → Tax = 10% of Gross
Rule 60 → Net = Gross - Tax
```

The rules should be configuration-driven rather than hardcoded into individual payslip screens.

---

# 18. Contract Resolution

Given:

```text
Employee = Rahul
Payrun = September 2026
```

The system searches contracts whose validity covers the payroll period.

Conceptually:

```text
contract.startDate <= period.end
AND
(contract.endDate IS NULL OR contract.endDate >= period.start)
```

If zero or multiple ambiguous contracts match:

```text
PAYROLL WARNING
```

Do not silently choose an arbitrary contract.

---

# 19. Payrun State Machine

```text
DRAFT
 ↓
COMPUTED
 ↓
VALIDATED
 ↓
PAID
```

A run with blocking warnings should not advance to finalization.

---

# 20. Payslip Generation

A payslip is created from:

```text
Payrun
+
Employee
+
Applicable Contract
+
Salary Structure
+
Salary Rule Results
```

Payslip lines store the individual computation components.

Example:

```text
Basic                  40,000
Housing Allowance       8,000
Transport                2,000
--------------------------------
Gross                   50,000
Tax                      5,000
--------------------------------
Net                     45,000
```

---

# 21. PDF Architecture

Recommended flow:

```text
Payslip
 ↓
PDF Service
 ↓
Template
 ↓
PDF Buffer/File
 ↓
Download OR Queue for Email
```

PDF generation should not block the entire payrun when bulk delivery is used.

---

# 22. Dashboard Architecture

Dashboard data should be queried from actual database records.

Example:

```text
PostgreSQL
    │
    ├── Employees
    ├── Attendance
    ├── Leave
    ├── Payruns
    └── Payslips
          ↓
     Aggregation Queries
          ↓
       API Layer
          ↓
      React Dashboard
```

Do not hardcode chart values.

---

# 23. Security Architecture

```text
Browser
 ↓ HTTPS
Express API
 ↓
Authentication Middleware
 ↓
Authorization / RBAC
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

## Authentication

- Password hashed with bcrypt.
- JWT/session mechanism.
- HTTP-only cookies.
- Secure cookie configuration.

## Authorization

Every protected operation checks role/permission.

Example:

```text
Employee
  → own records

HR Manager
  → HR records

HR Payroll User
  → payroll operational records

HR Payroll Manager
  → payroll configuration

Admin
  → everything
```

---

# 24. Audit Logging

Record high-value actions:

```text
LOGIN
EMPLOYEE_CREATED
CONTRACT_UPDATED
LEAVE_CREATED
LEAVE_APPROVED
LEAVE_REJECTED
ALLOCATION_CONSUMED
PAYRUN_CREATED
PAYRUN_COMPUTED
PAYRUN_VALIDATED
PAYRUN_PAID
PAYSLIP_SENT
ROLE_CHANGED
```

Each audit record can contain:

```text
actor
action
entity
entityId
timestamp
metadata
```

---

# 25. API Layer Pattern

Use:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Repository / Prisma
```

Example:

```text
POST /time-off/requests/:id/approve
              ↓
LeaveController
              ↓
LeaveService.approve()
              ↓
Transaction
              ↓
PostgreSQL
              ↓
Queue Event
```

Business rules should live in services, not controllers.

---

# 26. Error Handling

Use consistent API responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "LEAVE_BALANCE_INSUFFICIENT",
    "message": "Employee does not have enough available leave."
  }
}
```

Validation errors should identify invalid fields.

---

# 27. Environment Configuration

Example variables:

```text
DATABASE_URL=
REDIS_URL=

JWT_SECRET=

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

GEMINI_API_KEY=

MCP_SERVER_URL=
```

Never commit secrets to Git.

---

# 28. Docker Architecture

```text
docker-compose
│
├── frontend
├── backend
├── postgres
├── redis
├── worker
└── mcp-server
```

Development flow:

```text
docker compose up
        ↓
All services available locally
```

---

# 29. End-to-End Leave Flow

```text
1. Employee sends email
        ↓
2. Gmail receives email
        ↓
3. Gmail API retrieves message
        ↓
4. MCP exposes email tool
        ↓
5. Ingestion service stores message
        ↓
6. LangGraph starts
        ↓
7. Gemini classifies message
        ↓
8. Employee is identified
        ↓
9. Leave details extracted
        ↓
10. Zod validates AI output
        ↓
11. Business rules validate request
        ↓
12. LeaveRequest = PENDING
        ↓
13. HR sees request
        ↓
14. HR approves/rejects
        ↓
15. Transaction updates state/balance
        ↓
16. BullMQ job created
        ↓
17. Redis stores job
        ↓
18. Worker processes job
        ↓
19. MCP send_email()
        ↓
20. Gmail API
        ↓
21. Employee receives notification
        ↓
22. EmailLog/AuditLog updated
```

---

# 30. End-to-End Payroll Flow

```text
1. Payroll manager opens Payrun
        ↓
2. Select salary structure
        ↓
3. Select period
        ↓
4. Select employees
        ↓
5. Resolve applicable contracts
        ↓
6. Validate eligibility
        ↓
7. Execute salary rules
        ↓
8. Generate payslips
        ↓
9. Show warnings
        ↓
10. Validate
        ↓
11. Mark paid
        ↓
12. Generate PDF
        ↓
13. Queue bulk delivery
        ↓
14. Worker sends emails
        ↓
15. EmailLog updated
```

---

# 31. Recommended Implementation Order

## Phase 1 — Foundation

- Repository setup.
- Docker.
- PostgreSQL.
- Prisma.
- Express.
- React/Vite.
- Authentication.
- RBAC.

## Phase 2 — HR Core

- Employee.
- Department.
- Contract.
- Working schedule.

## Phase 3 — Leave

- Time-off types.
- Allocations.
- Requests.
- Approval/rejection.
- Balance consumption.

## Phase 4 — AI Email

- Gmail integration.
- Email ingestion.
- MCP email tools.
- LangGraph.
- Gemini.
- Structured extraction.
- Validation.
- Human review.

## Phase 5 — Automation

- Redis.
- BullMQ.
- Email worker.
- Notification templates.
- Email logs.
- Retry.

## Phase 6 — Payroll

- Salary structures.
- Salary rules.
- Payruns.
- Payslips.
- Validation warnings.

## Phase 7 — PDF & Bulk Delivery

- PDF generation.
- Bulk payslip jobs.
- Delivery tracking.

## Phase 8 — Dashboard

- KPIs.
- Charts.
- Filters.
- Alerts.
- Email activity.

## Phase 9 — Demo Hardening

- Seed realistic data.
- Add error states.
- Test duplicate email handling.
- Test failed jobs.
- Test approval race conditions.
- Test payroll warnings.
- Prepare five-minute walkthrough.

---

# 32. Testing Strategy

## Unit Tests

Test:

- Leave duration.
- Leave balance calculations.
- Contract selection.
- Salary rule execution.
- Gross/net calculation.
- Permission checks.

## Integration Tests

Test:

- Email → AI → LeaveRequest.
- Approval → allocation.
- Approval → queue.
- Queue → email.
- Payrun → payslip.
- Payslip → PDF.

## Edge Cases

### Email

- Missing dates.
- Ambiguous dates.
- Unknown employee.
- Non-leave email.
- Duplicate email.
- Multiple leave requests in one email.

### Leave

- Insufficient balance.
- Invalid date range.
- Duplicate request.
- Already approved request.
- Concurrent approval.

### Payroll

- Missing contract.
- Multiple applicable contracts.
- Missing salary structure.
- Invalid salary rule sequence.
- Duplicate payslip.
- Missing employee payroll information.

---

# 33. Observability

Provide an Email Activity screen:

```text
Received
Processed
Pending
Sent
Failed
```

And payroll warnings:

```text
Missing Information
Contract Issues
Duplicate Payslips
Failed Delivery
```

Workers should log:

```text
jobId
jobType
attempt
status
duration
error
```

---

# 34. Demo Data Strategy

Seed:

- 20–50 employees.
- Multiple departments.
- Historical contracts.
- Working schedules.
- Leave types.
- Leave allocations.
- Attendance records.
- Salary structures.
- Salary rules.
- Previous payruns.
- Previous payslips.
- Sample email logs.

This makes dashboard and payroll demonstrations look realistic.

---

# 35. Five-Minute Hackathon Demo

## Minute 0–1: Product

Show:

```text
Dashboard
Employee
Leave
Payroll
```

Explain:

> PeoplePay360 connects HR and payroll operations while turning employee email into an actionable workflow.

## Minute 1–2: AI Leave

Send:

```text
Subject: Leave Request

I need leave from 10 September to 12 September
for a family function.
```

Show the request appearing as pending.

## Minute 2–3: Human Approval

Open request.

Show:

```text
Employee
Dates
Leave Type
Reason
Balance
```

Click APPROVE.

Show balance update.

## Minute 3–4: Automation

Show:

```text
BullMQ
 ↓
Worker
 ↓
Email
```

Show employee notification and email log.

## Minute 4–5: Payroll

Create a payrun.

Show:

```text
Period
Contract
Salary Structure
Salary Rules
Payslip
PDF
Bulk Email
```

Finish with:

> **EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION**

---

# 36. Why This Solution Is Strong

The solution addresses the hackathon's emphasis on:

### Unified workflow

Employee records connect HR and payroll data.

### Business logic

Contracts, leave balances, schedules and salary rules affect real outcomes.

### AI

AI handles unstructured employee communication.

### Human control

HR remains responsible for approval decisions.

### Automation

BullMQ and Redis remove repetitive synchronous email work.

### Traceability

Email logs and audit logs make operations observable.

### Scalability

The architecture separates API requests, AI processing and background workers.

### Demonstrability

The complete workflow can be demonstrated in a few minutes.

---

# 37. Final Architecture Responsibility Map

| Technology | Responsibility |
|---|---|
| React | User interface |
| Vite | Frontend build tooling |
| Tailwind CSS | UI styling |
| Node.js | Backend runtime |
| Express | REST API |
| TypeScript | Application language |
| PostgreSQL | Persistent business data |
| Prisma | ORM/database access |
| LangGraph | AI workflow orchestration |
| LangChain | LLM/tool utilities |
| Gemini | Email understanding and extraction |
| Gmail API | Email integration |
| MCP | Email capability/tool interface |
| BullMQ | Background jobs |
| Redis | Queue infrastructure |
| Zod | Schema/input validation |
| JWT | Authentication mechanism |
| bcrypt | Password hashing |
| Docker | Local/deployment environment |
| Recharts | Dashboard visualization |

---

# 38. Final Product Statement

> **PeoplePay360 is an integrated HR and Payroll operations platform that transforms unstructured employee emails into validated HR workflows, keeps humans in control of decisions, and automates downstream communication and payroll operations.**

Core flow:

```text
EMPLOYEE
   ↓
EMAIL
   ↓
GMAIL API
   ↓
MCP
   ↓
LANGGRAPH + GEMINI
   ↓
STRUCTURED LEAVE REQUEST
   ↓
VALIDATION
   ↓
POSTGRESQL
   ↓
HR APPROVAL
   ↓
BULLMQ + REDIS
   ↓
EMAIL WORKER
   ↓
GMAIL API
   ↓
EMPLOYEE
```

And for payroll:

```text
EMPLOYEE
   ↓
CONTRACT + ATTENDANCE + LEAVE
   ↓
PAYRUN
   ↓
SALARY STRUCTURE
   ↓
SALARY RULE ENGINE
   ↓
PAYSLIP
   ↓
PDF
   ↓
BULK EMAIL
```

---

# 39. Multi-Agent AI System Extension


# Multi-Agent System — PeoplePay360

## 1. Architecture Extension

PeoplePay360 uses a **five-agent architecture** on top of the existing LangGraph + LangChain + Gemini layer.

The design principle is:

```text
Agents = Reasoning
MCP = Controlled Tools
PostgreSQL = Source of Truth
BullMQ + Redis = Background Execution
Human HR = Authority
```

Agents are not unrestricted database clients. They interact with the system through controlled tools and application services.

---

## 2. Multi-Agent Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| LLM | Google Gemini | Reasoning, classification, extraction, explanation |
| Agent orchestration | LangGraph.js | Stateful multi-agent workflows, routing, conditional paths |
| LLM/tool framework | LangChain.js | Prompts, structured output, tool integration |
| Tool interface | MCP | Controlled access to HR, payroll and email capabilities |
| Backend | Node.js + Express + TypeScript | APIs, authorization and deterministic business logic |
| Database | PostgreSQL + Prisma | Source of truth for HR/payroll records |
| Validation | Zod | AI output and API schema validation |
| Email integration | Gmail API | Receive/send email |
| Background jobs | BullMQ | Notifications, retries, bulk jobs |
| Queue/cache | Redis | BullMQ infrastructure and transient state |
| Frontend | React + TypeScript + Vite | HR/employee dashboard |
| UI | Tailwind CSS | Interface styling |
| Charts | Recharts | Live HR/payroll reporting |
| PDF | PDFKit/Puppeteer | Payslip generation |
| Infrastructure | Docker | Local and deployment environments |

---

## 3. Five-Agent Architecture

```text
                         USER / EMPLOYEE
                               │
                        Email / HR Query
                               ↓
                    ┌────────────────────┐
                    │ 1. ORCHESTRATOR    │
                    │       AGENT        │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
   2. EMAIL AGENT       3. LEAVE AGENT      4. PAYROLL AGENT
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                    5. ANALYTICS AGENT
                              │
                              ↓
                         MCP SERVER
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
          Gmail API       HR/Payroll API    Policy KB
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                         PostgreSQL
                              │
                     Human HR Decision
                              ↓
                       BullMQ + Redis
                              ↓
                        Email Worker
                              ↓
                          Gmail API
```

---

## 4. Agent Responsibilities

### Agent 1 — HR Orchestrator

**Technology:** LangGraph.js + Gemini

Responsibilities:
- Detect request intent.
- Route to the correct specialist.
- Pass context between agents.
- Manage workflow state.
- Decide whether the request needs clarification or human review.

It is a router/coordinator, not a business-authority agent.

---

### Agent 2 — Email Intelligence Agent

**Technology:** Gemini + LangChain structured output

Responsibilities:
- Read employee emails through controlled email tools.
- Classify intent.
- Extract leave dates, type and reason.
- Identify employee.
- Detect missing/ambiguous information.
- Return a validated structured object.

Example:
```json
{
  "intent": "LEAVE_REQUEST",
  "employeeId": "EMP-102",
  "leaveType": "CASUAL",
  "startDate": "2026-09-10",
  "endDate": "2026-09-12",
  "reason": "Family function",
  "confidence": 0.96
}
```

Zod validates the result before business logic consumes it.

---

### Agent 3 — Leave Management Agent

**Technology:** LangGraph + LangChain + MCP tools

Responsibilities:
- Check leave balance.
- Check overlapping requests.
- Check working schedule.
- Check configured leave policy.
- Validate duration and eligibility.
- Create a PENDING leave request through an authorized application action.

It **cannot approve or reject** a request.

---

### Agent 4 — Payroll Agent

**Technology:** LangGraph + Gemini + read-only MCP/application tools

Responsibilities:
- Explain payslips.
- Compare payroll periods.
- Explain salary-rule contributions.
- Inspect payroll warnings.
- Identify missing payroll information.
- Answer payroll questions.

Actual salary calculation remains deterministic in the payroll engine.

---

### Agent 5 — HR Analytics Agent

**Technology:** LangGraph + Gemini + read-only analytics tools

Responsibilities:
- Translate natural-language questions into safe analytics operations.
- Read authorized HR/payroll aggregates.
- Produce concise explanations.

Example:
```text
"Which department has the highest leave usage?"
                 ↓
        Analytics Agent
                 ↓
       Authorized read tool
                 ↓
            PostgreSQL
                 ↓
       Aggregated result
                 ↓
        Natural-language answer
```

The agent is read-only.

---

## 5. MCP Tool Layer

MCP sits between agents and external/system capabilities.

Suggested tools:

```text
get_unread_emails()
get_email()
search_emails()
mark_as_read()

get_employee()
get_employee_by_email()
get_leave_balance()
get_leave_requests()
get_contract()
get_working_schedule()
get_attendance()

get_payslip()
get_payrun()
get_payrun_warnings()

search_hr_policy()

create_leave_request()
send_email()
```

### Tool security

Each tool should:
- Validate inputs.
- Check authenticated user/agent permissions.
- Return only required fields.
- Log important actions.
- Reject unauthorized operations.

Do not expose raw unrestricted SQL or unrestricted Gmail credentials to agents.

---

## 6. LangGraph State

A shared workflow state can contain:

```text
requestId
employeeId
userId
intent
currentAgent
extractedData
validationResult
confidence
requiresClarification
requiresHumanReview
finalStatus
```

LangGraph handles transitions between specialist nodes.

Example:

```text
START
  ↓
Orchestrator
  ↓
Email Agent
  ↓
Leave Agent
  ↓
Validation
  ↓
Human Review
  ↓
Application Action
  ↓
Notification Job
  ↓
END
```

---

## 7. AI Safety Boundary

The architecture deliberately separates AI reasoning from authoritative transactions.

```text
                 AI LAYER
        ┌─────────────────────┐
        │ Understand          │
        │ Extract             │
        │ Validate            │
        │ Analyze             │
        │ Recommend           │
        └──────────┬──────────┘
                   ↓
             APPLICATION
        ┌─────────────────────┐
        │ Authorization       │
        │ Business Rules      │
        │ DB Transactions     │
        │ Payroll Engine      │
        └──────────┬──────────┘
                   ↓
             HUMAN AUTHORITY
        ┌─────────────────────┐
        │ Approve / Refuse    │
        └─────────────────────┘
```

This prevents an LLM response from directly becoming an unauthorized business transaction.

---

## 8. End-to-End Leave Workflow

```text
Employee
   ↓
Gmail API
   ↓
MCP
   ↓
Email Intelligence Agent
   ↓
Orchestrator
   ↓
Leave Management Agent
   ↓
MCP / Application Tools
   ↓
Employee + Leave Balance + Schedule + Policy
   ↓
Validation
   ↓
PostgreSQL → PENDING
   ↓
HR Dashboard
   ↓
Human Approval
   ↓
PostgreSQL Transaction
   ↓
BullMQ
   ↓
Redis
   ↓
Email Worker
   ↓
MCP → Gmail API
   ↓
Employee
```

---

## 9. Payroll Intelligence Workflow

```text
HR User
   ↓
"Why did this employee's salary change?"
   ↓
Orchestrator
   ↓
Payroll Agent
   ↓
Read-only payroll tools
   ↓
Payslip + Previous Payslip + Salary Rules
   ↓
Deterministic comparison
   ↓
Gemini explanation
   ↓
HR User
```

The Payroll Agent explains existing calculations; it does not replace the salary-rule engine.

---

## 10. Analytics Workflow

```text
HR User
   ↓
"Show departments with highest leave usage"
   ↓
Orchestrator
   ↓
Analytics Agent
   ↓
Authorized analytics tool
   ↓
PostgreSQL
   ↓
Aggregation
   ↓
Gemini explanation
   ↓
Dashboard / Chat response
```

---

## 11. Background Automation

Agents should not perform long-running notification work synchronously.

```text
Human Approval
      ↓
Application Transaction
      ↓
Create BullMQ Job
      ↓
Redis
      ↓
Worker
      ↓
MCP send_email()
      ↓
Gmail API
```

BullMQ provides retries, scheduling, failure tracking and bulk processing.

---

## 12. Multi-Agent Testing

### Agent tests
- Correct intent classification.
- Correct routing.
- Structured extraction.
- Missing information handling.
- Ambiguous date handling.
- Tool permission enforcement.
- Agent state transitions.

### Workflow tests
- Email → Email Agent → Leave Agent.
- Leave validation → PENDING.
- Human approval → allocation update.
- Approval → notification queue.
- Payroll question → Payroll Agent.
- Analytics question → read-only data.

### Safety tests
- Agent cannot approve leave.
- Agent cannot bypass role permissions.
- Agent cannot modify payroll calculations.
- Analytics Agent cannot write to PostgreSQL.
- Invalid AI output cannot enter business workflows.

---

## 13. Recommended Hackathon Implementation Scope

Do not implement dozens of agents. Build these five well:

```text
1. Orchestrator Agent
2. Email Intelligence Agent
3. Leave Management Agent
4. Payroll Agent
5. HR Analytics Agent
```

### Priority for the five-minute demo

**Demo 1 — Leave**
```text
Email
 → Email Agent
 → Orchestrator
 → Leave Agent
 → Validation
 → HR Approval
 → BullMQ
 → Employee Email
```

**Demo 2 — Payroll**
```text
Payroll question
 → Orchestrator
 → Payroll Agent
 → Payslip data
 → Explanation
```

**Demo 3 — Analytics**
```text
HR question
 → Orchestrator
 → Analytics Agent
 → Live PostgreSQL data
 → Answer
```

This gives PeoplePay360 a genuine multi-agent workflow without sacrificing the robust business logic required by the HR & Payroll specification.
