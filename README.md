# PeoplePay360 — AI-Powered HR & Payroll Automation Platform

> **EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Docker](https://img.shields.io/badge/Docker-24-2496ed.svg)
![LangGraph](https://img.shields.io/badge/LangGraph.js-Latest-1c3c3c.svg)
![Google](https://img.shields.io/badge/Google%20Gemini-2.0-4285f4.svg)

---

## 🚀 Overview

**PeoplePay360** is a unified HR and Payroll platform that connects employee master data, contracts, working schedules, attendance, time off, salary structures, payroll processing, and email automation into a single operational workflow. The platform's key differentiator is an **AI-powered email-to-workflow pipeline** where employees submit leave requests via natural-language email, which an AI system converts into validated HR workflows subject to human approval.

Instead of forcing employees to navigate complex forms for leave management, PeoplePay360 uses a natural-language email-to-workflow pipeline:

1. **Email Intake** ✉️ — Employee sends a leave email in natural language
2. **AI Classification & Extraction** 🤖 — AI identifies intent and extracts structured data (dates, type, reason)
3. **Validation** ✅ — Business rules check balances, overlaps, schedules, and policy rules
4. **Human Control** 🧑‍💼 — Pending requests are presented to HR managers for final approval/refusal
5. **Background Automation** ⚙️ — BullMQ + Redis queue sends notification emails asynchronously without blocking system processes

---

## 🏗️ System Architecture

The platform is composed of **six Docker services** orchestrated via Docker Compose:

```mermaid
graph TB
    subgraph "Docker Compose — PeoplePay360"
        FE["🖥️ client<br/>React + Vite<br/>:3000"]
        SRV["⚙️ server<br/>Express REST API<br/>:5000"]
        MCP["🔌 mcp-server<br/>Model Context Protocol<br/>:3001"]
        AGT["🤖 agent<br/>LangGraph + Gemini<br/>:3002"]
        WK["🔁 worker<br/>BullMQ Email/Jobs"]
        PG[("🐘 postgres<br/>PostgreSQL 15<br/>:5434")]
        RD[("⚡ redis<br/>Redis 7<br/>:6379")]
    end

    FE -->|"HTTP /api (proxy)"| SRV
    FE -.->|"direct"| AGT
    MCP -->|"Prisma"| PG
    SRV -->|"Prisma"| PG
    AGT -->|"Prisma"| PG
    AGT -->|"HTTP tools"| MCP
    WK -->|"BullMQ connection"| RD
    WK -->|"Prisma"| PG
    SRV -->|"BullMQ enqueue"| RD
    MCP -->|"Gmail API"| GM["📧 Gmail"]
    WK -->|"nodemailer"| SMTP["📤 SMTP / Brevo"]
    AGT -->|"Gemini API"| GLM["🧠 Google Gemini"]
```

### Service Responsibilities

| Service | Port | Responsibility | Technology |
|---|---|---|---|
| **postgres** | 5434 | Persistent business data (single source of truth) | PostgreSQL 15 |
| **redis** | 6379 | Queue infrastructure for BullMQ workers | Redis 7 |
| **server** | 5000 | Main REST API, auth, business logic, payroll engine | Node.js + Express + Prisma |
| **mcp-server** | 3001 | Model Context Protocol — controlled AI tool interfaces | MCP SDK |
| **agent** | 3002 | Multi-agent AI orchestration & email workflow | LangGraph + Gemini |
| **worker** | — | Background async processing (email delivery, payslip jobs) | BullMQ |

---

## 🤖 Multi-Agent AI Architecture

PeoplePay360 leverages a specialized **five-agent framework** built with **LangGraph.js**, **LangChain.js**, and **Google Gemini**:

```mermaid
graph TD
    USR["👤 User / Employee<br/>Email / HR Query"]
    USR -->|"natural-language input"| ORC

    ORC["1️⃣ HR Orchestrator Agent<br/>Router & State Manager"]
    ORC -->|"intent: LEAVE"| EMAIL
    ORC -->|"intent: LEAVE / BALANCE"| LEAVE
    ORC -->|"intent: PAYROLL"| PAY
    ORC -->|"intent: ANALYTICS"| ANY

    EMAIL["2️⃣ Email Intelligence Agent<br/>Classify & Extract"]
    LEAVE["3️⃣ Leave Management Agent<br/>Balance & Policy Checks"]
    PAY["4️⃣ Payroll Agent<br/>Payslip Explanation"]
    ANY["5️⃣ HR Analytics Agent<br/>Read-only Queries"]

    EMAIL -->|"structured intent"| ORC
    LEAVE -->|"PENDING request"| MCP
    PAY -->|"explanation"| MCP
    ANY -->|"aggregates"| MCP

    MCP["🔌 MCP Server — Controlled Tools"]
    MCP --> GMAIL["Gmail API"]
    MCP --> APIDB["HR/Payroll API + PostgreSQL"]
    MCP --> KB["Policy Knowledge Base (RAG)"]

    GMAIL -->|"notification"| USR
    APIDB --> HUMAN["🧑‍💼 Human HR Decision<br/>(Approve / Refuse)"]
    HUMAN --> BQ["BullMQ + Redis Queue"]
    BQ --> WK["Email Worker"]
    WK --> GMAIL
```

### Agent Roles

| # | Agent | Responsibility |
|---|---|---|
| 1 | **HR Orchestrator** | Central router and workflow state manager; detects intent, routes to the correct specialist, manages shared workflow state, decides between clarification and human review |
| 2 | **Email Intelligence** | Extracts structured leave intent from unstructured emails; classifies intent, extracts dates/type/reason, identifies employee, detects missing/ambiguous info, returns Zod-validated structured object |
| 3 | **Leave Management** | Validates requests against employee data, balances, schedules, and policies; creates `PENDING` leave requests — **cannot approve or refuse** |
| 4 | **Payroll Agent** | Explains payslips, compares periods, breaks down salary-rule contributions — reads existing calculations but never replaces the deterministic payroll engine |
| 5 | **HR Analytics** | Executes safe, read-only aggregate queries over live database stats and produces concise natural-language answers |

### Intent Catalog

```mermaid
graph LR
    subgraph "10 Chat Intents"
        A["APPLY_LEAVE"]
        B["LEAVE_BALANCE_INQUIRY"]
        C["CANCEL_LEAVE"]
        D["PAYSLIP_REQUEST"]
        E["SALARY_BREAKDOWN"]
        F["PAYROLL_INQUIRY"]
        G["ATTENDANCE_CORRECTION"]
        H["ATTENDANCE_INQUIRY"]
        I["HR_ANALYTICS"]
        J["COMPANY_POLICY"]
        K["GENERAL_UNCLEAR"]
    end
```

---

## 📧 Email → Leave Workflow

The end-to-end pipeline that moves a leave request from an employee's inbox through AI processing to HR approval and automated notification:

```mermaid
sequenceDiagram
    participant Emp as 👤 Employee
    participant GM as 📧 Gmail
    participant MCP as 🔌 MCP Server
    participant AG as 🤖 Agent (LangGraph+Gemini)
    participant DB as 🐘 PostgreSQL
    participant HR as 🧑‍💼 HR Dashboard
    participant BQ as 🔁 BullMQ + Redis
    participant WK as ⚙️ Email Worker

    Emp->>GM: Send leave email (natural language)
    GM->>MCP: Gmail API fetches unread message
    MCP->>AG: get_unread_emails() / get_email()
    AG->>AG: Email Intelligence Agent<br/>(classify intent + extract data)
    AG->>AG: Leave Management Agent<br/>(validate balance, schedule, policy)
    AG->>DB: Validate + create LeaveRequest (status: PENDING)
    DB->>HR: Leave request appears in dashboard
    HR->>DB: Approve / Refuse request (transactional)
    DB->>BQ: Enqueue notification job
    BQ->>WK: Process job
    WK->>Emp: Send approval/refusal email notification
```

---

## 💰 Payroll Processing

The deterministic payroll engine processes payruns through an explicit state machine:

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Payrun<br/>(period + structure + employees)
    DRAFT --> COMPUTED: POST /payruns/:id/compute
    COMPUTED --> VALIDATED: POST /payruns/:id/validate
    VALIDATED --> PAID: POST /payruns/:id/pay
    PAID --> [*]

    COMPUTED --> DRAFT: Warnings found<br/>(missing contract / info)
    note right of DRAFT
        Pre-run validation:
        resolve applicable contract,
        verify salary structure,
        check duplicate payslips
    end note
```

### Salary Rule Engine

```mermaid
flowchart TD
    subgraph "Rule Execution (ordered by sequence)"
        R1["Rule 10 — Basic<br/>FIXED: 40,000"]
        R2["Rule 20 — Housing<br/>PERCENTAGE: 20% of BASIC"]
        R3["Rule 30 — Transport<br/>FIXED: 2,000"]
        R4["Rule 40 — Gross<br/>FORMULA: BASIC + HOUSING + TRANSPORT"]
        R5["Rule 50 — Tax<br/>PERCENTAGE: 10% of GROSS"]
        R6["Rule 60 — Net<br/>FORMULA: GROSS - TAX"]
    end

    R1 --> R2 --> R3 --> R4 --> R5 --> R6

    subgraph "Computation Categories"
        C1["BASIC"]
        C2["ALLOWANCE"]
        C3["GROSS"]
        C4["DEDUCTION"]
        C5["NET"]
    end
```

### Payroll End-to-End

```mermaid
flowchart LR
    EMP["👤 Employee<br/>+ Contract<br/>+ Attendance<br/>+ Leave"] --> PR["Payrun"]
    PR --> SS["Salary Structure"]
    SS --> RE["Salary Rule Engine<br/>(deterministic)"]
    RE --> PS["Payslip"]
    PS --> PDF["📄 PDF Generation<br/>(PDFKit)"]
    PDF --> BULK["📧 Bulk Email Queue<br/>(BullMQ)"]
    BULK --> WK["Email Worker"]
    WK --> DONE["⬇️ Delivered"]
```

---

## 🗄️ Database Schema

The PostgreSQL schema (Prisma ORM) contains **22 models**. The central entity is `Employee`, which connects HR core, attendance, time off, and payroll:

```mermaid
erDiagram
    USER ||--o| EMPLOYEE : "has account"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDITLOG : "actor"
    USER ||--o{ LEAVEREQUEST : "reviews"

    DEPARTMENT ||--o{ EMPLOYEE : "has"
    DEPARTMENT ||--o{ CONTRACT : "has"

    WORKINGSCHEDULE ||--o{ EMPLOYEE : "assigned"
    WORKINGSCHEDULE ||--o{ CONTRACT : "uses"

    EMPLOYEE ||--o{ CONTRACT : "holds"
    EMPLOYEE ||--o{ ATTENDANCE : "records"
    EMPLOYEE ||--o{ LEAVEALLOCATION : "has"
    EMPLOYEE ||--o{ LEAVEREQUEST : "submits"
    EMPLOYEE ||--o{ PAYSLIP : "receives"
    EMPLOYEE ||--o| EMPLOYEE : "manage (self-ref)"

    LEAVETYPE ||--o{ LEAVEALLOCATION : "allocates"
    LEAVETYPE ||--o{ LEAVEREQUEST : "used by"

    SALARYSTRUCTURE ||--o{ SALARYRULE : "defines"
    SALARYSTRUCTURE ||--o{ CONTRACT : "referenced by"
    SALARYSTRUCTURE ||--o{ PAYRUN : "used in"
    SALARYSTRUCTURE ||--o{ PAYSLIP : "used in"

    CONTRACT ||--o{ PAYSLIP : "generates"

    PAYRUN ||--o{ PAYSLIP : "contains"
    PAYSLIP ||--o{ PAYSLIPLINE : "has"

    AIEXECUTION }o--|| USER : "tracks"
```

### Key Enumerations

| Domain | Values |
|---|---|
| **Roles** | `EMPLOYEE`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN` |
| **Leave Status** | `PENDING`, `APPROVED`, `REFUSED`, `CANCELLED` |
| **Leave Source** | `MANUAL`, `EMAIL_AI` |
| **Payrun Status** | `DRAFT`, `COMPUTED`, `VALIDATED`, `PAID` |
| **Payslip Status** | `DRAFT`, `COMPUTED`, `VERIFIED`, `PAID` |
| **Rule Category** | `BASIC`, `ALLOWANCE`, `GROSS`, `DEDUCTION`, `NET` |
| **Computation** | `FIXED`, `PERCENTAGE`, `FORMULA` |
| **AI Execution** | `SUCCESS`, `FAILED`, `NEEDS_CLARIFICATION`, `HUMAN_REVIEW` |

---

## 🔐 Security Architecture

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as Express API
    participant AM as Auth Middleware
    participant RB as RBAC Middleware
    participant C as Controller
    participant S as Service
    participant P as Prisma
    participant D as PostgreSQL

    B->>A: HTTPS request + JWT (cookie/token)
    A->>AM: authenticate
    AM->>RB: req.user populated
    RB->>C: role authorized?
    alt Authorized
        C->>S: business logic
        S->>P: query / transaction
        P->>D: SQL
        D-->>B: response
    else 403 Forbidden
        RB-->>B: FORBIDDEN
    end
```

### Design Principles

```mermaid
flowchart TD
    subgraph "AI SAFETY BOUNDARY"
        AI["🧠 AI Layer<br/>Understand · Extract<br/>Validate · Analyze · Recommend"]
        APP["⚙️ Application Layer<br/>Authorization · Business Rules<br/>DB Transactions · Payroll Engine"]
        HUM["🧑‍💼 Human Authority<br/>Approve / Refuse"]
    end

    AI -->|"NEVER bypasses"| APP
    APP -->|"final authority"| HUM

    style AI fill:#eef4ff,stroke:#3b82f6
    style APP fill:#f0fdf4,stroke:#16a34a
    style HUM fill:#fef3c7,stroke:#d97706
```

1. **AI is assistive, not authoritative** — AI extracts/validates but never approves; humans make the final HR decision.
2. **PostgreSQL is the single source of truth** — AI output is not persisted as truth until it passes application validation.
3. **Background work is asynchronous** — email sending and bulk operations go through BullMQ/Redis queues.
4. **Business rules live in application logic** — contracts, leave allocations, and salary rules are deterministic backend services.
5. **AI Safety Boundary** — the AI reasoning layer is separated from authoritative transactions (authorization, business rules, DB transactions, human approval).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router · Framer Motion · Recharts · lucide-react |
| **Backend** | Node.js 20 · Express 4 · Prisma ORM 5 · Zod 3 · JWT · bcryptjs · helmet · express-rate-limit |
| **Database** | PostgreSQL 15 (local) · Neon PostgreSQL w/ pgvector (remote RAG) |
| **AI Layer** | LangGraph.js · LangChain.js · Google Gemini 2.0 (`@google/generative-ai`) |
| **Integrations** | MCP (`@modelcontextprotocol/sdk`) · Gmail API |
| **Queue & Workers** | BullMQ 5 · ioredis · Redis 7 |
| **PDF** | PDFKit |
| **Docs** | Swagger/OpenAPI |
| **Infrastructure** | Docker · Docker Compose · Git/GitHub |

---

## 📂 Project Structure

```text
.
├── agent/                      # Multi-Agent Orchestration Layer (LangGraph + Gemini)
│   ├── src/
│   │   ├── agents/             # HROrchestratorAgent.js (working leave-email workflow)
│   │   ├── nodes/              # Email, leave, payroll, analytics agent nodes
│   │   ├── core/               # LangGraph state, graph builder, memory
│   │   ├── prompts/            # LLM prompt templates
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── tools/              # Leave/payroll/analytics DB tools
│   │   └── rag/                # RAG policy knowledge base (+ pgvector retriever)
│   ├── intents.json            # Intent catalog (10 intent types)
│   └── intents.ts              # Intent matching helpers
│
├── client/                     # Frontend React + Vite + Tailwind app (:3000)
│   └── src/
│       ├── api/                # REST API client
│       ├── components/         # UI components & layout
│       ├── context/            # Auth context
│       ├── features/           # auth, dashboard, employees, contracts,
│       │                       # schedules, attendance, leave, payroll, admin
│       └── routes/             # App routes
│
├── docs/                       # Architecture & PRD documentation
│   ├── PeoplePay360_Solution_MultiAgent.md
│   ├── PeoplePay360_PRD_MultiAgent.md
│   └── PeoplePay360_Entire_MultiAgent_Workflow.docx
│
├── mcp-server/                 # Model Context Protocol Server (:3001)
│   └── src/
│       ├── index.js            # Express server, GET /tools, POST /tools/:name
│       └── tools/index.js      # 4 MCP tools (emails, employee, leave balance, leave request)
│
├── server/                     # Backend REST API & Database Services (:5000)
│   ├── prisma/
│   │   ├── schema.prisma       # 22-model DB schema
│   │   └── seed.js             # Demo data (roles, departments, employees, salary rules)
│   └── src/
│       ├── modules/            # auth, departments, employees, contracts, schedules,
│       │                       # attendance, timeOff, payroll, dashboard, email
│       ├── services/           # payrollEngine, leaveService, pdfService, etc.
│       ├── middleware/         # auth, rbac, validate, error middleware
│       ├── schemas/            # Zod validation schemas
│       ├── utils/              # apiResponse, jwt, logger, email, constants
│       └── docs/swagger.json   # OpenAPI spec
│
└── worker/                     # Asynchronous Background Processing Workers
    └── src/
        └── queues/             # emailWorker.js (emailQueue + payslipQueue)
```

---

## 🚦 Prerequisites

- [Node.js](https://nodejs.org) **20+**
- [Docker](https://www.docker.com/products/docker-desktop) & Docker Compose
- [Google Gemini API key](https://ai.google.dev/) (for AI features)
- Optional: Gmail API credentials / Brevo SMTP for email features

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/team_49_odoo_grand_final_hackathon.git
cd team_49_odoo_grand_final_hackathon

# Install each service's dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..
cd agent && npm install && cd ..
cd mcp-server && npm install && cd ..
cd worker && npm install && cd ..
```

### 2. Configure Server

```bash
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, etc.
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

This starts all six services: **PostgreSQL, Redis, Server, MCP Server, Agent, and Worker**.

### 4. Seed the Database

```bash
cd server
npx prisma migrate dev
npm run seed
```

### 5. Run the Frontend (development)

```bash
cd client
npm run dev
```

Access the app at **http://localhost:3000**.

---

## 🔧 Running Services Individually

| Service | Directory | Command |
|---|---|---|
| **Server** | `server/` | `npm run dev` (port 5000) |
| **Client** | `client/` | `npm run dev` (port 3000) |
| **MCP Server** | `mcp-server/` | `npm run dev` (port 3001) |
| **Agent** | `agent/` | `npm run dev` (port 3002) |
| **Worker** | `worker/` | `npm run dev` |

---

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | — | PostgreSQL / Prisma connection string |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `5000` | Server port |
| `JWT_SECRET` | No | `super-secret-key-...` | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token lifetime |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `GEMINI_API_KEY` | No | — | Google Gemini API key |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |

> **⚠️ Security:** Never commit real secrets. `.env` files are git-ignored. Use separate values for local development vs. production.

---

## 📡 API Reference

All module routes are mounted under `/api`. Swagger UI is available at `GET /api/docs`.

### Auth (`/api/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/logout` | Public | Logout |
| GET | `/auth/me` | Authenticated | Current user |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password |
| POST | `/auth/users` | `ADMIN` | Create user |
| GET | `/auth/users` | `ADMIN` | List users |

### Departments (`/api/departments`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/departments` | Authenticated | List departments |
| GET | `/departments/:id` | Authenticated | Get department |
| POST | `/departments` | `ADMIN`, `HR_MANAGER` | Create department |
| PATCH | `/departments/:id` | `ADMIN`, `HR_MANAGER` | Update department |
| DELETE | `/departments/:id` | `ADMIN`, `HR_MANAGER` | Delete department |

### Employees (`/api/employees`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/employees` | HR roles | List employees |
| GET | `/employees/:id` | Authenticated | Get employee |
| POST | `/employees` | `ADMIN`, `HR_MANAGER` | Create employee |
| PATCH | `/employees/:id` | `ADMIN`, `HR_MANAGER` | Update employee |
| DELETE | `/employees/:id` | `ADMIN`, `HR_MANAGER` | Delete employee |

### Contracts (`/api/contracts`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/contracts` | HR roles | List contracts |
| GET | `/contracts/:id` | HR roles | Get contract |
| POST | `/contracts` | `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER` | Create contract |
| PATCH | `/contracts/:id` | `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER` | Update contract |
| DELETE | `/contracts/:id` | `ADMIN`, `HR_MANAGER` | Delete contract |

### Schedules (`/api/schedules`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/schedules` | Authenticated | List working schedules |
| GET | `/schedules/:id` | Authenticated | Get schedule |
| POST | `/schedules` | `ADMIN`, `HR_MANAGER` | Create schedule |
| PATCH | `/schedules/:id` | `ADMIN`, `HR_MANAGER` | Update schedule |
| DELETE | `/schedules/:id` | `ADMIN`, `HR_MANAGER` | Delete schedule |

### Attendance (`/api/attendance`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/attendance/check-in` | Authenticated | Check in |
| POST | `/attendance/check-out` | Authenticated | Check out |
| GET | `/attendance` | Authenticated | List attendance records |
| GET | `/attendance/:id` | Authenticated | Get attendance |
| PATCH | `/attendance/:id` | `ADMIN`, `HR_MANAGER` | Correct attendance |

### Time Off (`/api/time-off`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/time-off/types` | Authenticated | List leave types |
| POST | `/time-off/types` | `ADMIN`, `HR_MANAGER` | Create leave type |
| GET | `/time-off/allocations` | Authenticated | List allocations |
| POST | `/time-off/allocations` | `ADMIN`, `HR_MANAGER` | Create allocation |
| GET | `/time-off/employees/:employeeId/balance` | Authenticated | Get balance |
| POST | `/time-off/requests` | Authenticated | Create leave request |
| GET | `/time-off/requests` | Authenticated | List leave requests |
| POST | `/time-off/requests/:id/approve` | `ADMIN`, `HR_MANAGER` | Approve request |
| POST | `/time-off/requests/:id/refuse` | `ADMIN`, `HR_MANAGER` | Refuse request |
| POST | `/time-off/requests/:id/cancel` | Authenticated | Cancel request |

### Payroll (`/api/payroll`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/payroll/structures` | HR roles | List salary structures |
| POST | `/payroll/structures` | `ADMIN`, `HR_PAYROLL_MANAGER` | Create structure |
| GET | `/payroll/payruns` | HR roles | List payruns |
| POST | `/payroll/payruns` | `ADMIN`, `HR_PAYROLL_MANAGER` | Create payrun |
| POST | `/payroll/payruns/:id/compute` | `ADMIN`, `HR_PAYROLL_MANAGER` | Compute payrun |
| POST | `/payroll/payruns/:id/validate` | `ADMIN`, `HR_PAYROLL_MANAGER` | Validate payrun |
| POST | `/payroll/payruns/:id/pay` | `ADMIN`, `HR_PAYROLL_MANAGER` | Mark payrun paid |
| GET | `/payroll/payslips` | Authenticated | List payslips |
| GET | `/payroll/payslips/:id/pdf` | Authenticated | Download payslip PDF |

### Dashboard (`/api/dashboard`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/dashboard/overview` | HR roles | Overview KPIs |
| GET | `/dashboard/payroll` | HR roles | Payroll metrics |
| GET | `/dashboard/attendance` | HR roles | Attendance metrics |
| GET | `/dashboard/time-off` | HR roles | Time-off metrics |

### Email & Health

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/email/inbound` | Public | Inbound email webhook |
| GET | `/health` | Public | Server + PostgreSQL health check |

> **Agent service (port 3002):** `POST /agent/process-email`
> **MCP server (port 3001):** `GET /tools`, `POST /tools/:name`

---

## 🔑 Role-Based Access Control (RBAC)

```mermaid
graph LR
    subgraph Roles
        E["👤 EMPLOYEE"]
        HR["🧑‍💼 HR_MANAGER"]
        HU["🧮 HR_PAYROLL_USER"]
        HM["🔐 HR_PAYROLL_MANAGER"]
        A["🛡️ ADMIN"]
    end

    subgraph Permission Levels
        L1["Self-service:<br/>own attendance, leave, payslips, /me"]
        L2["HR Ops:<br/>employees, departments, contracts,<br/>schedules, allocations, approvals"]
        L3["Payroll Ops:<br/>view structures, payruns, wages"]
        L4["Payroll Mgmt:<br/>create structures, compute/validate/pay<br/>payruns, contracts"]
        L5["All:<br/>users, everything"]
    end

    E --> L1
    HR --> L1
    HR --> L2
    HU --> L1
    HU --> L3
    HM --> L1
    HM --> L2
    HM --> L3
    HM --> L4
    A --> L5
```

---

## 📖 Documentation

Detailed specification and architecture documents are available in the [docs](docs/) directory:

- [PeoplePay360 Solution Document](docs/PeoplePay360_Solution_MultiAgent.md) — Full architecture, workflows, and design decisions
- [PeoplePay360 PRD](docs/PeoplePay360_PRD_MultiAgent.md) — Product requirements
- [Multi-Agent Workflow Overview](docs/PeoplePay360_Entire_MultiAgent_Workflow.docx) — Visual workflow diagram
- [Agent Module Readme](agent/README.md) — Multi-agent & RAG architecture detail
- [Swagger API Docs](server/src/docs/swagger.json) — OpenAPI specification

---

## 🎬 5-Minute Hackathon Demo Walkthrough

**Minute 0–1 — Product:** Show the dashboard, employee records, leave management, and payroll screens. Explain: *"PeoplePay360 connects HR and payroll operations while turning employee emails into actionable workflows."*

**Minute 1–2 — AI Leave:** Send an email like *"I need leave from 10 September to 12 September for a family function"* and show the request appearing as **pending**.

**Minute 2–3 — Human Approval:** Open the request, verify the extracted fields (employee, dates, type, reason, balance), and click **APPROVE**. Show the balance update.

**Minute 3–4 — Automation:** Show the BullMQ → Worker → Email flow, the employee notification, and the email log entry.

**Minute 4–5 — Payroll:** Create a payrun → show period, contract, salary structure, salary rules, payslip, PDF download, and bulk email delivery.

Finish with:

> **EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION**

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request.

---

## 📜 License

**MIT** © Team 49 — Odoo Grand Final Hackathon

---

*Built with ❤️ by **Team 49** — PeoplePay360 · `EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION`*
