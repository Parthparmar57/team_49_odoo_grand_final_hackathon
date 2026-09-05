# PeoplePay360

**HR & Payroll Operations Platform** — an AI email-agent pipeline that reads natural-language employee emails, extracts the intent with Gemini, routes it to a specialized agent (Leave / Payroll / Analytics), runs deterministic business checks, and drafts an HR approval message.

```
Email → Email Intelligence Agent → HR Orchestrator → Specialized Agent → Human Approval
```

- The **LLM only understands and structures** requests. It NEVER computes balances, approves leave, or touches payroll numbers.
- All calculations (leave balance, overlap, working days, payroll figures) are **deterministic application logic** in `src/services/`.
- Sensitive actions always end with a **human approval** step.

---

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [File-by-File Guide](#file-by-file-guide)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Demo Scenarios](#demo-scenarios)
6. [Agent Architecture Overview](#agent-architecture-overview)
7. [Pipeline Flow](#pipeline-flow)
8. [Connect a Real PostgreSQL Database](#connect-a-real-postgresql-database)
9. [Troubleshooting](#troubleshooting)
10. [Security Notes](#security-notes)

---

## Folder Structure

```
oddo_agent/
├── README.md                      ← you are here
├── package.json                   Node 20+, ES modules. Scripts: start, dev
├── .env                           ← real config (API key) — never commit this
├── .env.example                   ← template with comments
├── .gitignore
└── src/
    ├── index.js                   ← entry point, wires the whole pipeline
    ├── agents/
    │   ├── email/                 ← Email Intelligence steps (1 per file)
    │   │   ├── sanitize.js         Step 1: strip HTML/reply noise
    │   │   ├── sender.js           Step 2: parse "From:" header
    │   │   ├── extract.js          Step 3: Gemini JSON extraction
    │   │   ├── normalize.js        Step 4: dates → YYYY-MM-DD, PL/SL/UL codes
    │   │   └── completeness.js     Step 5: detect missing info + clarification email
    │   ├── emailAgent.js          ← orchestrates the 5 email steps
    │   ├── hrOrchestrator.js      ← intent → employee → risk → agent + execution plan
    │   ├── leaveAgent.js          ← leave request agent (checks + PENDING_APPROVAL)
    │   ├── payrollAgent.js        ← payroll query agent (read-only)
    │   ├── analyticsAgent.js      ← analytics agent (read-only aggregates)
    │   └── humanApproval.js       ← HR approves/rejects, writes audit outcome
    ├── services/                  ← deterministic business data (in-memory today)
    │   ├── employeeService.js      employees
    │   ├── leaveService.js         leave types, balances, requests, dates
    │   ├── payrollService.js       contracts, payslips, payslip lines
    │   ├── analyticsService.js     payroll/attendance/leave aggregates
    │   └── workingScheduleService.js  work/off days, holidays
    ├── rag/
    │   └── policyStore.js         ← company policy documents + keyword retrieval
    ├── data/
    │   └── samples.js             ← sample emails, pick via EMAIL_SAMPLE
    ├── db/                        ← PostgreSQL schema + seed (go live here)
    │   ├── schema.sql
    │   └── seed.sql
    ├── lib/
    │   ├── config.js              ← env loading + validation
    │   └── gemini.js              ← Gemini client singleton
    └── validation/
        └── schemas.js             ← Zod schemas; LLM output is validated here
```

---

## File-by-File Guide

### Entry point — `src/index.js`
Loads a sample email (`EMAIL_SAMPLE` env var), runs the Email Intelligence Agent, routes through the HR Orchestrator to one of the three agents, prints the drafted HR message, then runs Human Approval. Exit paths: `NEEDS_CLARIFICATION` (prints the clarification email), unknown intent, unknown agent.

### Email Intelligence Agent
| File | Purpose |
|------|---------|
| `agents/email/sanitize.js` | Removes HTML, entities, reply/forward prefixes so extraction sees clean text. |
| `agents/email/sender.js` | Regex-parse `From: Name <email>` or `From: email`. |
| `agents/email/extract.js` | Sends the email to Gemini (temperature 0, JSON mime), then **validates the response with Zod** before returning. Never trusts the model blindly. |
| `agents/email/normalize.js` | Converts dates to `YYYY-MM-DD` and leave types to domain codes (`PL`/`SL`/`UL`). |
| `agents/email/completeness.js` | Decides what is missing. For leave: identity, leave type, start date, end date. For payroll: identity, question. Generates the **clarification email** asking the employee to fill gaps. |
| `agents/emailAgent.js` | Chains steps 1→5 and returns `READY`, `NEEDS_CLARIFICATION`, or stops. |

### Orchestrator & Specialized Agents
| File | Purpose |
|------|---------|
| `agents/hrOrchestrator.js` | 7-step pipeline: receive → understand intent → identify employee → check context → authorization/risk → select agent → build execution plan. Never touches the DB itself. |
| `agents/leaveAgent.js` | Runs checks (employee exists, leave balance, overlaps, working schedule, policy, sufficient balance) then creates a `PENDING_APPROVAL` request. |
| `agents/payrollAgent.js` | Read-only: fetches contract/payslip/payslip-lines and explains them to employees. |
| `agents/analyticsAgent.js` | Read-only aggregates (payroll cost, attendance, pending leave approvals) for HR review. |
| `agents/humanApproval.js` | The authority. Approves/rejects a leave request (updating its real status) or authorizes a draft for dispatch. |

### Services (deterministic data — the part you migrate to PostgreSQL)
| File | Data it holds today | DB table to use |
|------|--------------------|------------------|
| `employeeService.js` | `employees`, `findEmployeeByEmail` | `employees` |
| `leaveService.js` | leave types, allocations, requests; `parseDate` handles weekday names ("Monday") too | `leave_types`, `leave_allocations`, `leave_requests` |
| `payrollService.js` | contracts, payslips, payslip lines; period resolution ("June" → `2026-06`) | `contracts`, `payslips`, `payslip_lines` |
| `analyticsService.js` | payroll/attendance/leave aggregates | SQL `SUM`/`AVG`/`COUNT` views over the above tables |
| `workingScheduleService.js` | per-day WORK/OFF, company holidays | `working_schedule`, `company_holidays` |

### Other
| File | Purpose |
|------|---------|
| `rag/policyStore.js` | Company policies + keyword scoring. Stand-in for pgvector semantic search. |
| `data/samples.js` | Sample emails grouped by intent (`leave.*`, `payroll.*`, `analytics.*`). |
| `lib/config.js` | Reads and validates env vars; fails fast if `GEMINI_API_KEY` is missing. |
| `lib/gemini.js` | `GoogleGenAI` client singleton + `GEMINI_MODEL` constant. |
| `validation/schemas.js` | Zod: `Intent`, `LeaveType`, `EmailExtractionSchema`, `NormalizedExtractionSchema`. |
| `db/schema.sql` | PostgreSQL DDL mirroring every in-memory data source (see section 7). |
| `db/seed.sql` | Same demo records as the in-memory services, so migration is behaviour-identical. |

---

## Prerequisites

- **Node.js ≥ 20** (`node --version`)
- **Google Gemini API key** — get one at https://aistudio.google.com/apikey
- *(For the database step only)* **PostgreSQL ≥ 14** — https://www.postgresql.org/download/

---

## Quick Start

```powershell
# 1. Install dependencies
npm install

# 2. Create your env file and paste your Gemini API key
Copy-Item .env.example .env
# edit .env → GEMINI_API_KEY=your-key

# 3. Run the pipeline with a sample email
$env:EMAIL_SAMPLE="leave.normal"; node src/index.js
```

---

## Demo Scenarios

| `EMAIL_SAMPLE` | What happens |
|----------------|--------------|
| `leave.normal` | Rahul Sharma requests 15–16 Sep. Full pipeline → `PENDING_APPROVAL` → HR approves. |
| `leave.priyaWedding` | Priya Patel asks "Monday–Tuesday" (relative dates). Resolved to actual dates, **approved**. |
| `leave.relativeDate` | Priya Patel requests "Monday and Tuesday next week". Same relative-date path. |
| `leave.incomplete` | Amit Verma leaves out dates → **clarification email** asks for start/end date. |
| `leave.amitIncomplete` | Same as above with a slightly different email. |
| `leave.minimal` | Tiny email "PL Sep 15-16". Fastest Gemini call. |
| `payroll.payslip` | Rahul asks about his June payslip → PayrollAgent explains components. |
| `payroll.salaryDifference` | Amit asks why August salary was lower → PayrollAgent. |
| `payroll.pf` | Priya asks about PF deduction → PayrollAgent. |
| `analytics.attendance` | Department attendance analytics → AnalyticsAgent. |
| `analytics.payrollExpense` | Monthly payroll expense per department → AnalyticsAgent. |
| `analytics.employeeAttendance` | Personal attendance summary → AnalyticsAgent. |

To reset the env var when done:

```powershell
Remove-Item Env:EMAIL_SAMPLE
```

---

## Agent Architecture Overview

```
                          PEOPLEPAY360
                               │
                               ▼
                    ┌────────────────────┐
                    │ EMAIL INTELLIGENCE │
                    │       AGENT        │
                    │ (intent + extract) │
                    └─────────┬──────────┘
                              │ READY
                              ▼
                    ┌────────────────────┐
                    │  HR ORCHESTRATOR   │
                    │       AGENT        │
                    └─────────┬──────────┘
                              │ execution plan
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
 ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
 │   LEAVE AGENT   │  │  PAYROLL AGENT  │  │ ANALYTICS AGENT │
 └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │  HUMAN APPROVAL    │
                    │       AGENT        │
                    └────────────────────┘
```

```
                     ┌─────────────────────────────────────────────────────┐
                     │                     EMPLOYEE                        │
                     │         sends an email (leave / payroll / …)       │
                     └───────────────────────┬─────────────────────────────┘
                                             │ raw email
                                             ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │            1. EMAIL INTELLIGENCE AGENT  (src/agents/email*)     │
        │  ┌──────────┐ ┌────────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐ │
        │  │ sanitize │→│ sender │→│ extract │→│ normalize │→│complete- │ │
        │  │ (Step 1) │ │(Step 2)│ │(Step 3) │ │ (Step 4)  │ │ ness(5)  │ │
        │  └──────────┘ └────────┘ └────┬────┘ └───────────┘ └────┬─────┘ │
        │                  (Gemini JSON) │        │                │       │
        │                       Zod      ▼        │                ▼       │
        │                 validation/LLM never   │         NEEDS_         │
        │                 trusted blindly        │       CLARIFICATION → │
        └────────────────────────────────────────┼────────────────────────┘
                                                 │ READY
                                                 ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │            2. HR ORCHESTRATOR  (src/agents/hrOrchestrator.js)   │
        │  Step 1  Receive request                                         │
        │  Step 2  Understand intent (LEAVE/PAYROLL/ANALYTICS/…)           │
        │  Step 3  Identify employee (by email)                            │
        │  Step 4  Check context & required fields                         │
        │  Step 5  Authorization & risk (human approval gate)              │
        │  Step 6  Select specialized agent                                │
        │  Step 7  Build execution plan (tools + required checks)          │
        └──────────────────────────────┬───────────────────────────────────┘
                                       │ execution plan
                ┌──────────────────────┼───────────────────────┐
                ▼                      ▼                       ▼
   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
   │  3. LEAVE AGENT     │ │ 4. PAYROLL AGENT    │ │ 5. ANALYTICS AGENT  │
   │  src/agents/        │ │ src/agents/         │ │ src/agents/         │
   │  leaveAgent.js      │ │ payrollAgent.js     │ │ analyticsAgent.js   │
   │─────────────────────│ │─────────────────────│ │─────────────────────│
   │ tools (determi-     │ │ tools (determi-     │ │ tools (determi-     │
   │ nistic, no LLM):    │ │ nistic, no LLM):    │ │ nistic, no LLM):    │
   │ • getEmployee       │ │ • getEmployee       │ │ • getEmployee       │
   │ • getLeaveBalance   │ │ • getContract       │ │ • getPayrollMetrics │
   │ • getExisting       │ │ • getPayslip        │ │ • getAttendance     │
   │   LeaveRequests     │ │ • getPayslipLines   │ │   Metrics           │
   │ • getWorkingSchedule│ │  goal: READ +        │ │ • getLeaveMetrics   │
   │ • searchLeavePolicy │ │  EXPLAIN, read-only  │ │  goal: READ-only    │
   │ • createLeaveRequest│ │                     │ │  aggregates for HR  │
   │  goal: CREATE leave │ │                     │ │                     │
   │  (pending approval) │ │                     │ │                     │
   └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
              │                       │                       │
              │ PENDING_APPROVAL      │ RESPONSE_DRAFT        │ RESPONSE_DRAFT
              │ leave request         │ (isReadOnly: true)    │ (isReadOnly: true)
              ▼                       ▼                       ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │       6. HUMAN APPROVAL  (src/agents/humanApproval.js)               │
   │   • Leave   → APPROVE / REJECT updates real request status in DB     │
   │   • Payroll / Analytics → authorize draft for dispatch               │
   │   • Output → audit log + notify employee                             │
   └──────────────────────────────────────────────────────────────────────┘

   Supporting layers (called by agents):
   • src/services/*        deterministic business data (in-memory → PostgreSQL)
   • src/rag/policyStore   policy knowledge for RAG (no live truth)
   • src/validation/*      Zod schemas — LLM output gate
   • src/lib/*             config + Gemini client
```

### Mermaid version (renders on GitHub / GitLab)

```mermaid
flowchart TD
    EMP[Employee sends email] --> EIA[1. EMAIL INTELLIGENCE AGENT]

    subgraph EIA[Email Intelligence Agent]
        direction LR
        S1[sanitize<br/>Step 1] --> S2[sender<br/>Step 2] --> S3[extract Gemini JSON<br/>Step 3]
        S3 --> ZOD{Zod validation<br/>passes?} -->|no| FAIL[Reject / retry]
        ZOD -->|yes| S4[normalize<br/>Step 4] --> S5[completeness<br/>Step 5]
        S5 -->|missing info| CLARIF[NEEDS_CLARIFICATION<br/>clarification email ↔ employee]
    end

    EIA -->|READY| ORCH[2. HR ORCHESTRATOR]
    subgraph ORCH[HR Orchestrator]
        direction TB
        O1[Receive] --> O2[Understand intent] --> O3[Identify employee]
        O3 --> O4[Check context] --> O5[Authorization & risk] --> O6[Select agent] --> O7[Execution plan]
    end

    ORCH -->|leave| LEAVE[3. LEAVE AGENT]
    ORCH -->|payroll| PAY[4. PAYROLL AGENT]
    ORCH -->|analytics| ANA[5. ANALYTICS AGENT]

    subgraph DB[Deterministic data layer]
        SVCS[src/services/*<br/>balance, overlap, schedule,<br/>payslips, aggregates]
        RAG[src/rag/policyStore<br/>policy knowledge]
    end

    LEAVE <--> DB
    PAY <--> DB
    ANA <--> DB

    LEAVE -->|PENDING_APPROVAL<br/>leave request| HA[6. HUMAN APPROVAL]
    PAY -->|response draft| HA
    ANA -->|response draft| HA

    HA -->|APPROVE / REJECT<br/>/ authorize| AUDIT[audit log + notify employee]
```

---

## Pipeline Flow

```
[1] From: email header           sanitizeEmail → identifySender
[2] Body                         Gemini structured extraction (JSON, temp 0)
                                   ↓
[3] Zod validation               EmailExtractionSchema
                                   ↓
[4] Normalize                    date + leave-type mapping
                                   ↓
[5] Completeness                 missing? → clarification email & stop
                                   ↓ (READY)
[6] HR Orchestrator              7 steps → execution plan
                                   ↓
[7] Specialized Agent            passes checks, creates PENDING_APPROVAL
                                   ↓
[8] Human Approval               APPROVED / REJECTED / draft authorized
                                   ↓
[9] Audit log                    notify_employee_and_audit_log
```

Key safety rule: the **agent creates the request, HR approves it**. No agent can finalize a sensitive action.

---

## Connect a Real PostgreSQL Database

The services keep data in memory right now, but their function signatures already mirror a database-backed service, and `src/db/schema.sql` + `src/db/seed.sql` define the real tables. Here is the full path to go live.

### 1. Install PostgreSQL
Windows: https://www.postgresql.org/download/ (install `psql` and the server).
Verify: `psql --version`

### 2. Create the database

```powershell
# Connect as the postgres superuser
psql -U postgres

# Inside psql:
CREATE DATABASE peoplepay360;
\q
```

### 3. Apply schema and seed

```powershell
# From the project root (oddo_agent/)
psql -U postgres -d peoplepay360 -f src/db/schema.sql
psql -U postgres -d peoplepay360 -f src/db/seed.sql
```

If you use a password, set `PGPASSWORD` first or use the full connection string:

```powershell
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/peoplepay360"
psql $env:DATABASE_URL -f src/db/schema.sql
psql $env:DATABASE_URL -f src/db/seed.sql
```

Put the same string into `.env` as `DATABASE_URL`.

### 4. Install the PostgreSQL driver

```powershell
npm install pg
```

### 5. Create a shared client (`src/lib/db.js`)

```js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}
```

> The `pg` package is **not** installed yet. Run `npm install pg` before importing this file.

### 6. Migrate a service, table by table

Example — replace the in-memory employees in `src/services/employeeService.js`:

```js
import { query } from "../lib/db.js";

export async function getEmployee(id) {
  const rows = await query(
    `SELECT id, employee_number, full_name AS name, email, department_id, status, date_of_joining
       FROM employees WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function findEmployeeByEmail(email) {
  const clean = String(email || "").replace(/\[([^\]]+)\]\(mailto:[^)]+\)/i, "$1").trim().toLowerCase();
  const rows = await query(
    `SELECT id, employee_number, full_name AS name, email, department_id, status, date_of_joining
       FROM employees WHERE lower(email) = $1`,
    [clean]
  );
  return rows[0] || null;
}
```

> **Caveat:** the service functions are currently synchronous, and agents call them without `await` (e.g. `getEmployee(employeeId)` in `leaveAgent.js`). Making them async means adding `await` at every call site. Do this per service, run a demo scenario, and confirm output is unchanged.

### 7. Migration mapping cheat-sheet

| In-memory module | SQL table(s) | Service function → SQL pattern |
|------------------|--------------|--------------------------------|
| `employeeService.js` | `employees` | `getEmployee`, `findEmployeeByEmail` → `SELECT ... FROM employees WHERE ...` |
| `leaveService.js` | `leave_types`, `leave_allocations`, `leave_requests` | balance → `SELECT allocated, used FROM leave_allocations`; overlap → `WHERE status <> 'CANCELLED' AND start_date <= $2 AND end_date >= $1`; insert request → `INSERT INTO leave_requests ... RETURNING *` |
| `payrollService.js` | `contracts`, `payslips`, `payslip_lines` | payslip → `SELECT ... FROM payslips ps JOIN payslip_lines pl ON pl.payslip_id = ps.id WHERE employee_id=$1 AND month=$2` |
| `workingScheduleService.js` | `working_schedule`, `company_holidays` | isWorkingDay → check override, then default, minus holidays |
| `analyticsService.js` | aggregates over the above | payroll cost → `SELECT SUM(monthly_gross) FROM contracts`; attendance → `AVG(...)`; leave → `SELECT status, COUNT(*) FROM leave_requests GROUP BY status` |
| `rag/policyStore.js` | `policy_documents` | add an `embedding vector(1536)` column and use `pgvector` (`ORDER BY embedding <=> $embedding LIMIT $k`) |

### 8. (Optional) Use Prisma instead of raw SQL
If you prefer an ORM:

```powershell
npm install -D prisma @prisma/client
npx prisma init
npx prisma db pull   # introspect the schema you already created
npx prisma generate
```

`db/migrations/` will then hold versioned migrations, and `prisma.schema` models map 1:1 to the tables above.

---

## Troubleshooting

| Symptom | Cause & fix |
|---------|-------------|
| `429 RESOURCE_EXHAUSTED ... FreeTier limit: 20` | Free-tier daily quota for that model is used up. Switch `GEMINI_MODEL` to a model with separate quota (e.g. `gemini-3.5-flash-lite`) or use a billing-enabled key. |
| `503 UNAVAILABLE` | Gemini briefly over-loaded. Retry in a few seconds. |
| `404 ... no longer available` | The model name is retired for your key. Check available models, or use the latest flash (`gemini-3.5-flash-lite` / `gemini-3.6-flash`). |
| `Missing required environment variables` | Copy `.env.example` to `.env` and set `GEMINI_API_KEY`. |
| `Status: INVALID_DATES` | Dates not interpretable. `parseDate` supports `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, `"September 15"`, `"15 September"`, and weekday names ("Monday"). |
| `Status: NEEDS_CLARIFICATION` | The email was missing required fields — the pipeline prints a clarification email and stops (expected for `leave.incomplete`). |
| `apiKey` errors / invalid key | Regenerate the key in Google AI Studio and update `.env`. |

---

## Security Notes

- **Never commit `.env`** — it holds your Gemini API key. `.gitignore` already excludes it.
- The LLM output passes through **Zod validation** before touching any business logic (`validation/schemas.js`).
- Sensitive actions (leave approval) are **human-gated**: agents can create requests, only HR can approve.
- If you wire the DB, use **parameterized queries** (`$1`, `$2`) and keep credentials in `.env`.

---

## Scripts

```powershell
npm start    # node src/index.js
npm run dev  # node --watch src/index.js (auto-restart on changes)
```