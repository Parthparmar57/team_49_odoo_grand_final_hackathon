# PRD — PeoplePay360: AI-Powered HR, Leave & Payroll Automation

**Version:** 1.0  
**Status:** Hackathon MVP / Product Specification  
**Primary positioning:** AI-powered email-to-workflow automation for employee leave management, integrated with HR and payroll operations.

---

## 1. Product Overview

PeoplePay360 is an integrated HR and Payroll operations platform that connects employee master data, contracts, working schedules, attendance, time off, salary structures, payroll processing, payslips, dashboards, and email automation into one operational workflow.

The differentiating workflow is **email-to-workflow automation**:

> **EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION**

An employee can send a leave request using natural-language email instead of filling a form. The system receives the email, classifies it, extracts structured leave information, validates it against employee and leave data, creates a pending request, and presents it to an authorized HR user. The human decision remains authoritative. After approval or rejection, an asynchronous job sends the employee a notification.

The wider platform also supports payroll operations: period-specific contracts, attendance, leave allocation, salary structures/rules, payruns, payslips, PDF generation, bulk delivery, and live reporting.

---

# 2. Problem Statement

Traditional HR systems often separate employee records, contracts, attendance, leave, and payroll into disconnected screens and workflows.

This creates operational friction:

- Employees must repeatedly enter information into forms.
- HR must manually interpret leave emails and re-enter the data.
- Leave balances and approvals can become disconnected from payroll.
- Historical contracts need to be handled correctly for each payroll period.
- Payroll calculations need configurable salary rules rather than hardcoded values.
- Payroll teams need warnings before finalization.
- Payslips need to be generated and distributed efficiently.

PeoplePay360 solves this by making the employee record the central hub and connecting HR operations with payroll and automated communication.

---

# 3. Product Goals

## 3.1 Primary Goals

1. Build a unified employee-centered HR and payroll platform.
2. Automate natural-language leave request intake through email.
3. Use AI to classify and extract leave information.
4. Keep approval/rejection under human control.
5. Connect approved leave with leave balances and downstream payroll context.
6. Support period-specific contract selection during payroll.
7. Provide configurable salary structures and ordered salary rules.
8. Generate validated payslips with transparent calculations.
9. Generate printable PDF payslips.
10. Support bulk employee email delivery.
11. Provide a live operational dashboard.
12. Demonstrate complete end-to-end business workflows rather than isolated CRUD screens.

## 3.2 Success Criteria

The MVP is successful when a judge can observe:

- An employee record being used as the operational hub.
- A leave request arriving through email.
- AI converting the unstructured email into structured data.
- Validation creating a PENDING leave request.
- An HR user approving/refusing it.
- The leave balance updating when appropriate.
- A notification being queued and delivered asynchronously.
- A payrun selecting the correct employees and period.
- Payslips being calculated from contracts, salary structures and salary rules.
- A payslip being rendered as PDF and sent by email.
- Dashboard metrics changing from live system data.

---

# 4. Non-Goals for MVP

The MVP does not need to provide:

- Autonomous AI approval/rejection of leave.
- Fully autonomous payroll payment to bank accounts.
- Complex tax compliance for every jurisdiction.
- Advanced biometric hardware integrations.
- Full accounting/ERP functionality.
- Production-scale multi-region infrastructure.
- AI-generated salary decisions.
- Replacement of human HR/payroll authorization.

---

# 5. Target Users & Roles

## 5.1 Employee

Can:

- View own employee details.
- View attendance.
- View leave balances.
- Create leave requests.
- Submit leave requests by email.
- View request status.
- Receive approval/rejection notifications.
- Access payslips where permitted.

Cannot:

- Manage other employees.
- Approve leave.
- Configure payroll.
- Modify salary rules.

## 5.2 HR Manager

Can:

- Manage employees.
- Manage contracts.
- Manage working schedules.
- Manage attendance.
- Manage time-off types and allocations.
- Approve/refuse time-off requests.

Does not require payroll administration access.

## 5.3 HR Payroll User

Has HR Manager capabilities plus:

- Create/read/update payruns and payslips.
- Read salary structures and salary rules.
- Process payroll within assigned permissions.

## 5.4 HR Payroll Manager

Can:

- Fully manage payruns.
- Fully manage payslips.
- Manage salary structures.
- Manage salary rules.
- Control payroll configuration.

## 5.5 Admin

Has full access to all modules and system administration, including:

- User management.
- Role assignment.
- Permission management.
- Configuration.
- Audit visibility.

---

# 6. Core Modules

## 6.1 Employee Master

Employee is the central business entity.

### Required fields

- Employee ID
- Name
- Email
- Department
- Manager
- Job position
- Employee type
- Working schedule
- Status
- Join date
- Optional payroll/bank information

### Views

- List
- Kanban
- Form
- Search/filter

### Related records

The employee form should expose smart links/counts for:

- Contracts
- Attendance
- Time Off
- Allocations
- Payslips
- Email activity

---

# 7. Contract Management

Contracts are historical records associated with employees.

### Requirements

- Multiple contracts per employee.
- Start and end dates.
- Department.
- Position.
- Wage.
- Salary structure.
- Status.
- Historical preservation.

### Critical business rule

For every payrun:

> Select only the contract applicable to the selected payroll period.

The system must prevent ambiguous/concurrent contracts from silently being used.

---

# 8. Working Schedule

A working schedule defines expected working time.

### Schedule fields

- Name
- Type
- Weekly hours
- Day
- Start time
- End time
- Break

### Rules

- Weekly hours are calculated automatically.
- Schedule can be assigned to employees/contracts.
- Attendance and payroll can use the assigned schedule as context.

---

# 9. Time Off / Leave Management

## 9.1 Time-Off Types

A time-off type defines:

- Name
- Unit: days/hours
- Allocation requirement
- Approval workflow
- Payroll integration behavior

Examples:

- Casual Leave
- Sick Leave
- Paid Leave
- Unpaid Leave

## 9.2 Allocations

An allocation tracks an employee's available entitlement.

Metrics:

- Allocated
- Taken
- Remaining
- Validity period
- Status

### Rule

Approved requests that require allocations automatically consume the corresponding balance.

---

# 10. AI Email-to-Leave Workflow

This is the primary product differentiator.

## 10.1 Example Input

Employee sends:

> Subject: Leave Request  
> Hi HR, I need leave from 10 September to 12 September because of a family function. Regards, Rahul.

## 10.2 AI Output

The AI should transform the message into structured data:

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

## 10.3 AI Workflow

```text
START
  ↓
Receive Email
  ↓
Classify Email
  ↓
Leave Request?
 ┌───────────────┴───────────────┐
 NO                              YES
 ↓                                ↓
Normal Email                  Identify Employee
 ↓                                ↓
END                            Extract Details
                                  ↓
                              Validate Data
                                  ↓
                           Create PENDING Request
                                  ↓
                              Notify HR
                                  ↓
                                 END
```

## 10.4 AI Safety Rule

AI must **not** approve or reject leave.

Correct:

```text
AI
 ↓
Understand
 ↓
Extract
 ↓
Validate
 ↓
Create Request
 ↓
Human HR Decision
 ↓
Automation
```

Incorrect:

```text
Employee → AI → Automatic Approval
```

---

# 11. Email Architecture

## Incoming Email

```text
Employee
   ↓
Gmail
   ↓
Gmail API
   ↓
MCP Email Tools
   ↓
Node/Express
   ↓
LangGraph
   ↓
PostgreSQL
   ↓
HR Dashboard
```

## Outgoing Email

```text
HR Decision
   ↓
PostgreSQL
   ↓
BullMQ
   ↓
Redis
   ↓
Email Worker
   ↓
MCP send_email()
   ↓
Gmail API
   ↓
Employee
```

MCP is an integration/tool layer, not an email provider.

---

# 12. Leave Approval Workflow

## Approve

```text
HR clicks APPROVE
      ↓
Validate request
      ↓
Check balance/rules
      ↓
Update LeaveRequest = APPROVED
      ↓
Consume allocation when applicable
      ↓
Create notification job
      ↓
BullMQ + Redis
      ↓
Email Worker
      ↓
Send approval email
```

## Reject

```text
HR clicks REJECT
      ↓
Store rejection reason
      ↓
LeaveRequest = REJECTED
      ↓
Create notification job
      ↓
BullMQ + Redis
      ↓
Email Worker
      ↓
Send rejection email
```

---

# 13. Attendance

### Required capabilities

- Check-in.
- Check-out.
- Worked-hours calculation.
- Status.
- Exception handling.
- Authorized manual corrections.
- Reporting availability.

Possible statuses:

- Present
- Late
- Absent
- Overtime
- Missing checkout
- Corrected

---

# 14. Salary Structures

A salary structure is a container of ordered salary rules.

Example:

```text
Regular Salary
 ├── Basic
 ├── Housing Allowance
 ├── Transport Allowance
 ├── Gross
 ├── Tax
 ├── Other Deductions
 └── Net
```

Each structure has:

- Name
- Active status
- Rules
- Execution sequence
- Associated employees/contracts

---

# 15. Salary Rules

Salary rules define computation logic.

### Attributes

- Name
- Code
- Category
- Sequence
- Computation method
- Amount/formula

### Categories

- Basic
- Allowance
- Gross
- Deduction
- Net

### Computation methods

- Fixed amount
- Percentage
- Formula

Rules execute sequentially so later calculations can depend on earlier values.

---

# 16. Payrun

A payrun groups payslips for a payroll period.

## Creation Wizard

### Step 1

Select:

- Salary Structure
- Period

### Step 2

Filter/select eligible employees.

### Step 3

Create payrun.

The payrun should contain only explicitly selected employees.

## Processing

```text
DRAFT
 ↓
COMPUTE
 ↓
VALIDATE
 ↓
MARK PAID
 ↓
SEND PAYSLIPS
```

Validation warnings should appear before finalization.

Examples:

- Missing bank information.
- Duplicate payslip.
- Missing contract.
- Invalid period contract.
- Missing employee information.

---

# 17. Payslip

Each payslip contains:

- Employee
- Payrun
- Salary structure
- Period
- Worked days
- Basic
- Allowances
- Gross
- Deductions
- Net
- Status

### Computation source

The calculation must use:

```text
Selected Payrun Period
        +
Applicable Employee Contract
        +
Assigned Salary Structure
        +
Ordered Salary Rules
        ↓
Payslip
```

---

# 18. Payslip PDF & Delivery

Requirements:

- Generate printable PDF for an individual payslip.
- Support bulk sending from a payrun.
- Record delivery attempts.
- Track sent/failed status.

Bulk delivery must use asynchronous processing.

```text
Payrun
 ↓
Select Payslips
 ↓
Create Email Jobs
 ↓
BullMQ
 ↓
Redis
 ↓
Workers
 ↓
MCP
 ↓
Gmail API
```

---

# 19. Dashboard

The dashboard should use live data rather than static charts.

## KPI cards

- Total Net Salary Paid
- Payslips Generated
- Average Salary
- Approved Time Off
- Attendance Health
- Pending Leave Requests

## Filters

- Payroll period
- Department
- Employee type

## Charts

- Salary cost by department.
- Monthly net salary trend.
- Leave trends.
- Attendance overview.

## Operational alerts

- Missing required information.
- Duplicate payslips.
- Contract issues.
- Pending approvals.
- Failed email jobs.

---

# 20. Navigation

Recommended top navigation:

```text
Dashboard
Employees
Contracts
Attendance
Time Off
Payroll
Reports
Email Activity
Administration
```

---

# 21. Functional Requirements

## FR-01 Authentication

The system shall authenticate users and maintain sessions securely.

## FR-02 Authorization

The system shall enforce role-based permissions at API and UI levels.

## FR-03 Employee Management

Authorized users shall create, read, update and manage employee records.

## FR-04 Contract Management

Authorized users shall maintain historical employee contracts.

## FR-05 Period Contract Resolution

Payroll shall select the contract applicable to the payrun period.

## FR-06 Schedule Management

Authorized users shall configure weekly working schedules.

## FR-07 Attendance

The system shall store check-in, check-out, worked hours and corrections.

## FR-08 Leave Configuration

Authorized users shall configure time-off types and allocations.

## FR-09 Email Intake

The system shall receive employee email messages through the configured email integration.

## FR-10 AI Classification

The system shall classify incoming messages as leave-related or non-leave-related.

## FR-11 AI Extraction

The system shall extract relevant leave fields from leave-related emails.

## FR-12 Validation

The system shall validate employee identity, dates, leave type and applicable balance/rules.

## FR-13 Human Approval

Only authorized HR users shall approve/refuse leave.

## FR-14 Leave Balance

Approved allocation-based requests shall consume the corresponding allocation.

## FR-15 Notifications

Approval/rejection notifications shall be queued and delivered asynchronously.

## FR-16 Salary Structures

Authorized payroll users shall configure salary structures.

## FR-17 Salary Rules

Authorized payroll managers shall configure ordered salary rules.

## FR-18 Payrun

Payroll users shall create, compute and validate payruns.

## FR-19 Payslip

The system shall calculate and display detailed payslips.

## FR-20 PDF

The system shall generate printable payslip PDFs.

## FR-21 Bulk Email

The system shall support bulk payslip email delivery.

## FR-22 Reporting

The dashboard shall aggregate live operational data.

## FR-23 Auditability

Important actions shall be recorded in an audit log.

---

# 22. Non-Functional Requirements

## Security

- HTTP-only cookies for session/token storage where applicable.
- Password hashing with bcrypt.
- Input validation using Zod.
- RBAC.
- Least-privilege access.
- Audit logs.
- Secrets stored outside source code.

## Reliability

- Background email jobs.
- Retry handling.
- Failed-job tracking.
- Idempotent processing where possible.
- No duplicate notification for the same event.

## Performance

- Paginated list views.
- Indexed database fields.
- Background processing for email and PDF-heavy operations.
- Efficient dashboard queries.

## Maintainability

- TypeScript across backend.
- Modular services.
- Clear separation between API, domain logic, AI workflow, workers and integrations.
- Database migrations.

## Observability

Track:

- Email received.
- AI processing status.
- Leave creation.
- Approval/rejection.
- Queue status.
- Email delivery status.
- Payroll computation.
- Validation warnings.

---

# 23. Data Model

Core entities:

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

Relationships:

```text
Employee
 ├── Contracts
 ├── Attendance
 ├── LeaveRequests
 ├── LeaveAllocations
 └── Payslips

Contract
 └── SalaryStructure

SalaryStructure
 └── SalaryRules

Payrun
 └── Payslips

Payslip
 └── PayslipLines

Email
 └── LeaveRequest / Employee

EmailLog
 └── Email delivery lifecycle
```

---

# 24. Leave Request State Machine

```text
RECEIVED
   ↓
PROCESSING
   ↓
VALIDATED
   ↓
PENDING
 ┌─┴───────────────┐
 ↓                 ↓
APPROVED         REJECTED
 ↓                 ↓
NOTIFICATION     NOTIFICATION
 ↓                 ↓
COMPLETED        COMPLETED
```

An invalid request can move to:

```text
NEEDS_REVIEW
```

when human clarification is required.

---

# 25. AI Confidence & Human Review

AI extraction should produce structured output plus confidence.

Example:

```json
{
  "startDate": "2026-09-10",
  "endDate": "2026-09-12",
  "leaveType": "Casual Leave",
  "reason": "Family function",
  "confidence": 0.94
}
```

If critical fields are missing or confidence is below the configured threshold:

```text
AI
 ↓
NEEDS_REVIEW
 ↓
HR manually corrects/enters missing fields
```

AI remains assistive rather than authoritative.

---

# 26. Email Idempotency

Each incoming message should have a unique provider/message ID.

Before processing:

```text
Message ID
 ↓
Already processed?
 ├── YES → Ignore duplicate
 └── NO  → Process
```

This prevents duplicate leave requests when an email is re-read.

---

# 27. API Surface

Suggested REST endpoints:

## Auth

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Employees

```text
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
DELETE /api/employees/:id
```

## Contracts

```text
GET  /api/contracts
POST /api/contracts
GET  /api/contracts/:id
PATCH /api/contracts/:id
```

## Attendance

```text
GET  /api/attendance
POST /api/attendance
PATCH /api/attendance/:id
```

## Time Off

```text
GET  /api/time-off/types
POST /api/time-off/types
GET  /api/time-off/allocations
POST /api/time-off/allocations
GET  /api/time-off/requests
POST /api/time-off/requests
POST /api/time-off/requests/:id/approve
POST /api/time-off/requests/:id/reject
```

## Payroll

```text
GET  /api/payroll/structures
POST /api/payroll/structures
GET  /api/payroll/rules
POST /api/payroll/rules
POST /api/payruns
GET  /api/payruns/:id
POST /api/payruns/:id/compute
POST /api/payruns/:id/validate
POST /api/payruns/:id/mark-paid
POST /api/payruns/:id/send
```

## Dashboard

```text
GET /api/dashboard/overview
GET /api/dashboard/payroll
GET /api/dashboard/attendance
GET /api/dashboard/time-off
```

---

# 28. Acceptance Criteria

## Leave Email

Given a valid employee sends a leave email:

- The message is received.
- It is classified as a leave request.
- Employee identity is resolved.
- Dates are extracted.
- Leave type is resolved or flagged.
- Reason is stored.
- A pending request appears on the dashboard.

## Approval

When HR approves:

- Request becomes APPROVED.
- Allocation is consumed when applicable.
- An email job is created.
- Worker sends notification.
- Email activity is recorded.

## Rejection

When HR rejects:

- Request becomes REJECTED.
- Rejection reason is stored.
- Notification is queued.
- Employee receives the result.
- Email activity is recorded.

## Payroll

For a selected period:

- Correct contract is selected.
- Selected salary structure is applied.
- Salary rules execute in order.
- Warnings are surfaced.
- Payslip is generated.
- PDF can be produced.
- Bulk delivery can be initiated.

---

# 29. Hackathon Demo Scenario

## Scenario A — AI Leave Automation

1. Employee sends leave email.
2. System receives it.
3. AI classifies and extracts the request.
4. Request appears as PENDING.
5. HR opens the request.
6. HR approves it.
7. Leave balance updates.
8. Email notification enters the queue.
9. Worker sends the email.
10. Dashboard shows updated activity.

## Scenario B — Payroll

1. Payroll manager opens Payrun creation.
2. Selects salary structure and period.
3. Selects employees.
4. System resolves applicable contracts.
5. Compute is clicked.
6. Salary rules generate payslip lines.
7. Validation warnings are reviewed.
8. Payrun is validated/marked paid.
9. Payslip PDF is generated.
10. Payslips are bulk emailed.

---

# 30. MVP Priority

## P0 — Must Have

- Authentication/RBAC.
- Employee management.
- Leave types and allocations.
- Email intake.
- AI leave extraction.
- Pending leave dashboard.
- Approve/reject workflow.
- Leave balance update.
- BullMQ/Redis notification queue.
- Gmail email sending.
- Basic payroll.
- Salary rules.
- Payrun.
- Payslip.
- PDF generation.
- Dashboard.

## P1 — Should Have

- Attendance exception handling.
- Advanced filters.
- Email activity page.
- Audit logs.
- Retry dashboard.
- Confidence-based AI review.

## P2 — Future

- Mobile app.
- Multi-company support.
- Advanced analytics.
- Calendar integrations.
- Additional email providers.
- Advanced payroll/tax integrations.
- Employee self-service enhancements.

---

# 31. Product Differentiation

The project should not be presented merely as:

> “An employee leave management dashboard.”

The stronger positioning is:

> **AI-powered email-to-workflow automation for employee leave management, integrated into an operational HR and payroll platform.**

The key transformation is:

```text
UNSTRUCTURED EMAIL
        ↓
AI UNDERSTANDING
        ↓
STRUCTURED HR DATA
        ↓
HUMAN DECISION
        ↓
AUTOMATED ACTION
        ↓
PAYROLL / HR RECORDS
        ↓
EMPLOYEE NOTIFICATION
```

---

# 32. Final Product Principle

The system should prioritize **real business logic and connected workflows over superficial UI complexity**.

The employee record is the hub. Contracts, schedules, attendance, leave and payroll connect to it. AI handles interpretation, humans retain authority, and automation handles repetitive downstream work.

---

# 39. Multi-Agent AI System Extension


# Multi-Agent AI Architecture — PeoplePay360

## Purpose

PeoplePay360 extends its existing AI-powered email-to-workflow capability into a controlled multi-agent HR system. The agents are specialized by business responsibility and are coordinated by an Orchestrator Agent.

The multi-agent layer is **assistive, not autonomous authority**. HR users remain responsible for approval/rejection and other privileged business decisions.

## 1. Five-Agent System

### 1.1 HR Orchestrator Agent

**Role:** Central router and workflow coordinator.

Responsibilities:
- Understand the employee/HR request.
- Identify the correct specialist agent.
- Pass only the required context to that agent.
- Collect the specialist result.
- Route the workflow to validation, human review, or response.
- Maintain workflow state through LangGraph.

Example:
```text
"How many employees are absent today?"
        ↓
Analytics Agent

"Why is my salary lower this month?"
        ↓
Payroll Agent

"I need leave from Monday to Wednesday."
        ↓
Email / Leave workflow
```

The Orchestrator does not directly bypass authorization or approve HR actions.

### 1.2 Email Intelligence Agent

**Role:** Convert unstructured employee email into structured intent and data.

Workflow:
```text
Gmail
  ↓
Email Agent
  ↓
Classify Intent
  ↓
Extract Entities
  ↓
Identify Employee
  ↓
Validate Output Schema
  ↓
Structured Request
```

Typical extracted fields:
- employee
- intent
- leave type
- start date
- end date
- reason
- confidence
- missing/ambiguous fields

If required information is missing or ambiguous, the workflow should request clarification instead of inventing values.

### 1.3 Leave Management Agent

**Role:** Validate leave requests against real HR data and policy.

Workflow:
```text
Structured Leave Request
        ↓
Employee Data
        ↓
Leave Balance
        ↓
Existing Requests / Overlap
        ↓
Working Schedule
        ↓
Leave Policy
        ↓
Validation Result
        ↓
PENDING Request / Clarification / Exception
```

Important rule:
> The Leave Agent can validate and recommend. It must not approve or reject leave.

Approval remains a human HR action.

### 1.4 Payroll Agent

**Role:** Explain payroll results and identify payroll-related issues.

Capabilities:
- Explain payslip differences.
- Compare current and previous payslips.
- Explain salary-rule contributions to gross/net salary.
- Inspect payrun warnings.
- Identify missing or inconsistent payroll information.
- Assist HR/payroll users with payroll questions.

The agent should use controlled read tools and deterministic payroll calculations. It should not invent salary figures or independently finalize payroll.

### 1.5 HR Analytics Agent

**Role:** Answer natural-language questions using authorized, read-only HR/payroll data.

Example questions:
- "How many employees are absent today?"
- "Which department has the highest leave usage?"
- "What is our total salary cost this month?"
- "How many payslips are pending?"
- "Which employees have low leave balances?"

Workflow:
```text
HR Question
    ↓
Analytics Agent
    ↓
Intent + Query Planning
    ↓
Authorized Read Tool
    ↓
PostgreSQL
    ↓
Aggregate / Analyze
    ↓
Human-readable Answer
```

The Analytics Agent must be read-only and must respect the user's role permissions.

## 2. Agent + Tool Architecture

```text
                         EMPLOYEE / HR USER
                                │
                         Email / HR Query
                                ↓
                     ┌────────────────────┐
                     │  ORCHESTRATOR      │
                     │      AGENT         │
                     └─────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ↓                 ↓                 ↓
       EMAIL AGENT        LEAVE AGENT       PAYROLL AGENT
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ↓
                       ANALYTICS AGENT
                               │
                               ↓
                         MCP TOOL LAYER
                               │
          ┌────────────────────┼────────────────────┐
          ↓                    ↓                    ↓
       Gmail API          HR/Payroll API        Policy KB
          │                    │                    │
          └────────────────────┼────────────────────┘
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

## 3. MCP Tool Design

Agents should never receive unrestricted database or Gmail access. MCP exposes narrow, auditable capabilities.

Suggested tools:
```text
get_employee()
get_employee_by_email()
get_leave_balance()
get_leave_requests()
get_contract()
get_working_schedule()
get_attendance()
get_payslip()
get_payrun_warnings()
search_hr_policy()
create_leave_request()
send_email()
```

Recommended permissions:
- Email Agent: email read/search + employee lookup.
- Leave Agent: employee/leave/schedule/policy reads + create pending leave request.
- Payroll Agent: payroll/payslip read tools.
- Analytics Agent: read-only aggregate/reporting tools.
- Orchestrator: routing only.
- Communication actions: application-controlled and queued where appropriate.

## 4. State and Safety

Each LangGraph workflow should maintain explicit state such as:
```text
requestId
employeeId
intent
agent
extractedData
validationResult
confidence
requiresHumanReview
finalStatus
```

AI-generated values must be validated with Zod before entering business workflows.

Business-critical actions remain deterministic:
- Leave approval/rejection.
- Leave balance deduction.
- Payroll calculation.
- Payrun validation/finalization.
- Permission checks.
- Email job execution.

## 5. Human-in-the-Loop

The multi-agent system follows:

```text
AI Understands
     ↓
AI Validates
     ↓
AI Recommends
     ↓
Human Decides
     ↓
System Executes
```

This preserves the original PeoplePay360 principle that AI assists HR rather than replacing HR authorization.

## 6. Example End-to-End Multi-Agent Leave Flow

```text
Employee sends email
        ↓
Gmail API
        ↓
Email Intelligence Agent
        ↓
Extract leave request
        ↓
Orchestrator
        ↓
Leave Management Agent
        ↓
Check employee + balance + schedule + policy
        ↓
Create PENDING request
        ↓
HR Dashboard
        ↓
HR Approves / Refuses
        ↓
PostgreSQL transaction
        ↓
BullMQ + Redis
        ↓
Email Worker
        ↓
MCP → Gmail API
        ↓
Employee notification
```

## 7. Example Payroll Intelligence Flow

```text
HR: "Why did Rahul's salary decrease?"
        ↓
Orchestrator
        ↓
Payroll Agent
        ↓
get_payslip()
get_previous_payslip()
get_salary_rules()
        ↓
Compare deterministic values
        ↓
Explain difference
        ↓
HR / Employee receives explanation
```

## 8. Hackathon Demo Value

The five-agent architecture creates a clear demonstration:

1. Send a natural-language leave email.
2. Email Agent extracts the request.
3. Orchestrator routes it to Leave Agent.
4. Leave Agent validates balance, dates and policy.
5. HR sees a PENDING request and makes the final decision.
6. Approval triggers BullMQ/Redis notification.
7. Ask Payroll Agent to explain a payslip difference.
8. Ask Analytics Agent a live HR question.

This demonstrates genuine agent specialization while keeping the underlying HR and payroll business logic reliable.
