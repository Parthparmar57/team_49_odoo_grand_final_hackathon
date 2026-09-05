-- ============================================================
-- PeoplePay360 — PostgreSQL schema
-- ============================================================
-- Run with:  psql -U <user> -d peoplepay360 -f src/db/schema.sql
--
-- This schema mirrors every data source that is currently kept
-- in memory in the src/services/ modules. Connect each service
-- (employeeService, leaveService, payrollService, ...) to these
-- tables when going live.
--
-- Conventions:
--   * UUID primary keys
--   * snake_case column names
--   * approved_by / approved_at / rejection_reason kept on
--     leave_requests so human approval is auditable
-- ============================================================

BEGIN;

-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  head_email  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number  TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  department_id    UUID REFERENCES departments(id),
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
  date_of_joining  DATE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department_id);

-- ============================================================
-- CONTRACTS (salary structure)
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type   TEXT NOT NULL DEFAULT 'PERMANENT',
  start_date      DATE NOT NULL,
  probation_end   DATE,
  currency        TEXT NOT NULL DEFAULT 'INR',
  monthly_gross   NUMERIC(12,2) NOT NULL,
  basic           NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra             NUMERIC(12,2) NOT NULL DEFAULT 0,
  special_allow   NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf_deduction    NUMERIC(12,2) NOT NULL DEFAULT 0,
  pt_deduction    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee ON contracts (employee_id);

-- ============================================================
-- PAYSLIPS + PAYSLIP LINES (flat per-component rows)
-- ============================================================

CREATE TABLE IF NOT EXISTS payslips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month       TEXT NOT NULL,                 -- '2026-06' format
  gross       NUMERIC(12,2) NOT NULL,
  net         NUMERIC(12,2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'GENERATED',
  UNIQUE (employee_id, month)
);

CREATE TABLE IF NOT EXISTS payslip_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id  UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  line_type   TEXT NOT NULL CHECK (line_type IN ('EARNING', 'DEDUCTION')),
  component   TEXT NOT NULL,                 -- 'Basic', 'HRA', 'PF', 'PT', ...
  amount      NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON payslips (employee_id, month);

-- ============================================================
-- LEAVE TYPES, ALLOCATIONS, REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_types (
  code                TEXT PRIMARY KEY,      -- PL / SL / UL
  name                TEXT NOT NULL,
  default_allocation  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_allocations (
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type    TEXT NOT NULL REFERENCES leave_types(code),
  allocated     INT NOT NULL DEFAULT 0,
  used          INT NOT NULL DEFAULT 0,
  PRIMARY KEY (employee_id, leave_type)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number   TEXT NOT NULL UNIQUE,
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type       TEXT NOT NULL REFERENCES leave_types(code),
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  days             INT NOT NULL,
  working_dates    DATE[] NOT NULL DEFAULT '{}',
  reason           TEXT,
  status           TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
                     CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests (status);

-- ============================================================
-- WORKING SCHEDULE + HOLIDAYS
-- ============================================================

CREATE TABLE IF NOT EXISTS working_schedule (
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  day_status    TEXT NOT NULL CHECK (day_status IN ('WORK', 'OFF')),
  PRIMARY KEY (employee_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS company_holidays (
  date   DATE PRIMARY KEY,
  label  TEXT NOT NULL
);

-- ============================================================
-- POLICY DOCUMENTS (RAG source — for pgvector when semantic
-- search is enabled, add embedding columns)
-- ============================================================

CREATE TABLE IF NOT EXISTS policy_documents (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category  TEXT NOT NULL,
  title     TEXT NOT NULL,
  content   TEXT NOT NULL,
  tags      TEXT[] NOT NULL DEFAULT '{}'
);

-- ============================================================
-- AUDIT LOG (who approved what, when)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT,
  worker_email    TEXT,
  action          TEXT NOT NULL,
  details         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log (request_id);

COMMIT;