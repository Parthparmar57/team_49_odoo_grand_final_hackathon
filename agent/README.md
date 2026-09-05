# PeoplePay360 — AI Multi-Agent & RAG Architecture

This module implements the **Autonomous HR & Payroll Multi-Agent Pipeline** for PeoplePay360, built with **LangGraph.js**, **Google Gemini**, and **Neon PostgreSQL (pgvector)**.

---

## 🏛️ System Architecture

```text
[ Gmail / Inbound Email ]
           │
           ▼
[ Email Intelligence Agent ] ──(Missing Info?)──► [ Clarification Node ] ──► [ Gmail Worker ]
           │ (Structured Intent & Entities)
           ▼
[ HR Orchestrator Router ]
           │
   ┌───────┼───────────────────────────────┬──────────────────────────────┐
   ▼       ▼                               ▼                              ▼
[ Leave Agent ]                    [ Payroll Agent ]              [ Analytics Agent ]
(Balance & Schedule Checks)       (Rule Sequencing & Breakdown)   (Read-only DB Metrics)
   │       │                               │                              │
   │   [ RAG Retriever ]                   │                              │
   │   (Neon pgvector Policy Lookup)       │                              │
   │       │                               │                              │
   └───────┴───────────────────────────────┴──────────────────────────────┘
                                   │
                                   ▼
                    [ Neon PostgreSQL Database ]
                    (Status: PENDING_APPROVAL)
                                   │
                                   ▼
                       [ Human HR Decision ]
                                   │
                                   ▼
                      [ BullMQ + Redis Queue ]
                                   │
                                   ▼
                         [ Gmail Worker ]
```

---

## 📂 Folder Structure

```text
agent/
├── config/
│   ├── gemini.config.ts            # Gemini 2.0 Flash / Pro model configuration
│   └── database.config.ts          # Neon PG Client & pgvector extension setup
├── core/
│   ├── state.ts                    # LangGraph AgentState interface & types
│   ├── graph.ts                    # LangGraph StateGraph builder & conditional routing
│   └── memory.ts                   # PostgreSQL thread checkpoint saver
├── rag/
│   ├── seed/                       # Raw HR Markdown documentation for vector store
│   │   ├── leave_policy.md         # Quotas, carry-forward, types
│   │   ├── payroll_rules.md        # Basic, HRA, PF, PT, deductions
│   │   └── company_handbook.md     # Working hours, schedules, notice periods
│   ├── ingest.ts                   # Chunking & embedding generator (Gemini -> Neon)
│   └── pgvector_retriever.ts       # Cosine similarity vector search over Neon pgvector
├── schemas/
│   ├── email.schema.ts             # Zod schema for Email Intelligence output
│   ├── leave.schema.ts             # Zod schema for Leave Agent actions
│   └── payroll.schema.ts           # Zod schema for Payroll Agent actions
├── prompts/
│   ├── email_intelligence.prompt.ts# Prompt for intent & entity extraction
│   ├── orchestrator.prompt.ts      # Prompt for routing decisions
│   ├── leave_agent.prompt.ts       # Prompt for leave reasoning
│   └── rag_policy.prompt.ts        # Prompt for RAG policy retrieval QA
├── nodes/
│   ├── email_intelligence.node.ts  # Node 1: Ingests & extracts from email
│   ├── orchestrator.node.ts        # Node 2: Routes to matching specialist
│   ├── leave_agent.node.ts         # Node 3: Leave business logic + DB actions
│   ├── payroll_agent.node.ts       # Node 4: Payroll explanation + rule checks
│   ├── analytics_agent.node.ts     # Node 5: SQL aggregate metrics
│   └── clarification.node.ts       # Node 6: Generates missing-info replies
├── tools/
│   ├── leave.tools.ts              # Neon DB tools for Leave queries & mutations
│   ├── payroll.tools.ts            # Neon DB tools for Payroll & contract queries
│   └── analytics.tools.ts          # Neon DB tools for Read-only analytics
├── intents.json                    # Catalog of intents, keywords, and entity rules
├── intents.ts                      # TypeScript types and helper functions for intents
└── README.md                       # This architecture reference document
```

---

## 🧠 Core Agent Roles

1. **Email Intelligence Agent (`nodes/email_intelligence.node.ts`)**:
   - Converts natural-language email text into structured JSON via Gemini structured outputs.
   - Normalizes relative date phrases (`"tomorrow"`, `"next Monday"`) to real ISO dates.
   - Detects missing required entities and routes to `clarification.node.ts`.

2. **HR Orchestrator Router (`nodes/orchestrator.node.ts`)**:
   - Inspects the classified intent against `intents.json`.
   - Routes the workflow to `LeaveAgent`, `PayrollAgent`, or `AnalyticsAgent`.

3. **Leave Agent (`nodes/leave_agent.node.ts`)**:
   - Checks employee leave allocation balances, schedules, and active contracts.
   - Queries `rag/pgvector_retriever.ts` for company-specific leave policy clauses.
   - Inserts draft requests into Neon PostgreSQL with `status: PENDING_APPROVAL`.

4. **Payroll Agent (`nodes/payroll_agent.node.ts`)**:
   - Validates active period-specific contracts and executes ordered salary rules.
   - Explains deductions (PF, Tax, LOP) in natural language.

5. **Analytics Agent (`nodes/analytics_agent.node.ts`)**:
   - Executes safe, read-only aggregate queries on live Neon data.

---

## 🗄️ Neon pgvector RAG Integration

All policy documents in `agent/rag/seed/` are chunked and embedded into a `DocumentChunk` table in **Neon PostgreSQL**:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "DocumentChunk" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
```
