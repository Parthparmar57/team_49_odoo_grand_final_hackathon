# PeoplePay360 — AI-Powered HR & Payroll Automation Platform

> **EMAIL → AI → WORKFLOW → APPROVAL → AUTOMATION**

PeoplePay360 is a unified HR and Payroll platform that connects employee master data, contracts, working schedules, attendance, time off, salary structures, payroll processing, and email automation into a single operational workflow.

---

## 🌟 Key Differentiator: Multi-Agent AI Workflow

Instead of forcing employees to navigate complex forms for leave management, PeoplePay360 uses a natural-language email-to-workflow pipeline:
1. **Email Intake**: Employee sends a leave email in natural language.
2. **AI Classification & Extraction**: AI identifies intent and extracts structured data (dates, type, reason).
3. **Validation**: Business rules check balances, overlaps, schedules, and policy rules.
4. **Human Control**: Pending requests are presented to HR managers for final approval/refusal.
5. **Background Automation**: BullMQ + Redis queue sends notification emails asynchronously without blocking system processes.

---

## 🤖 5-Agent Architecture

PeoplePay360 leverages a specialized multi-agent framework built with **LangGraph.js**, **LangChain.js**, and **Google Gemini**:

1. **HR Orchestrator Agent**: Central router and workflow state manager.
2. **Email Intelligence Agent**: Extracts structured leave intent from unstructured emails.
3. **Leave Management Agent**: Validates leave requests against employee data, balances, and policies.
4. **Payroll Agent**: Compares payslips across periods and explains salary-rule breakdowns.
5. **HR Analytics Agent**: Executes safe, read-only queries over live database aggregates.

---

## 🛠️ Technology Stack

* **Frontend**: React, Vite, TypeScript, Tailwind CSS, Recharts
* **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod
* **Database**: PostgreSQL
* **AI Layer**: LangGraph.js, LangChain.js, Google Gemini
* **Integrations**: MCP (Model Context Protocol), Gmail API
* **Queue & Workers**: BullMQ, Redis

---

## 📂 Project Structure

```text
.
├── agent/       # Multi-Agent Orchestration Layer (LangGraph + Gemini)
├── client/      # Frontend React + Vite Dashboard App
├── docs/        # Complete Specification, PRD & Architecture Documentation
├── mcp-server/  # Model Context Protocol Server (Gmail & Tool Interfaces)
├── server/      # Backend REST API & Database Services (Node.js + Prisma)
└── worker/      # Asynchronous Background Processing Workers (BullMQ + Redis)
```

---

## 📖 Documentation

Detailed specification and architecture documents are available in the [docs](docs/) directory:
* [PeoplePay360 Solution Document](docs/PeoplePay360_Solution_MultiAgent.md)
* [PeoplePay360 PRD](docs/PeoplePay360_PRD_MultiAgent.md)
* [Multi-Agent Workflow Overview](docs/PeoplePay360_Entire_MultiAgent_Workflow.docx)
