-- ============================================================
-- PeoplePay360 — seed data
-- ============================================================
-- Run with:  psql -U <user> -d peoplepay360 -f src/db/seed.sql
--
-- Loads the same demo records the in-memory services currently
-- hardcode, so migrating to PostgreSQL one table at a time keeps
-- behaviour identical.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Departments
-- ------------------------------------------------------------
INSERT INTO departments (code, name, head_email) VALUES
  ('ENG', 'Engineering', 'rahul@technova.com'),
  ('DEVOPS', 'DevOps', 'priya@technova.com');

-- ------------------------------------------------------------
-- Employees
-- ------------------------------------------------------------
INSERT INTO employees (employee_number, full_name, email, department_id, status, date_of_joining) VALUES
  ('EMP001', 'Rahul Sharma', 'rahul@technova.com', (SELECT id FROM departments WHERE code = 'ENG'), 'ACTIVE', '2023-04-10'),
  ('EMP002', 'Priya Patel', 'priya@technova.com', (SELECT id FROM departments WHERE code = 'DEVOPS'), 'ACTIVE', '2022-01-05'),
  ('EMP009', 'Harsh Patel', 'harshjpatel200666@gmail.com', (SELECT id FROM departments WHERE code = 'DEVOPS'), 'ACTIVE', '2024-09-01');

-- ------------------------------------------------------------
-- Contracts (matches src/services/payrollService.js)
-- ------------------------------------------------------------
INSERT INTO contracts
  (employee_id, contract_type, start_date, probation_end, currency, monthly_gross,
   basic, hra, special_allow, pf_deduction, pt_deduction)
VALUES
  ((SELECT id FROM employees WHERE employee_number = 'EMP001'), 'PERMANENT', '2023-04-10', '2023-10-10',
   'INR', 58000, 40000, 18000, 0, 4800, 200),
  ((SELECT id FROM employees WHERE employee_number = 'EMP002'), 'PERMANENT', '2022-01-05', '2022-07-05',
   'INR', 70000, 50000, 20000, 0, 6000, 200);

-- ------------------------------------------------------------
-- Payslips (matches src/services/payrollService.js)
-- ------------------------------------------------------------
INSERT INTO payslips (employee_id, month, gross, net, status)
SELECT id, '2026-06', 58000, 53000, 'GENERATED' FROM employees WHERE employee_number = 'EMP001';

INSERT INTO payslips (employee_id, month, gross, net, status)
SELECT id, '2026-06', 70000, 63800, 'GENERATED' FROM employees WHERE employee_number = 'EMP002';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'EARNING', 'Basic', 40000 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP001';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'EARNING', 'HRA', 18000 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP001';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'DEDUCTION', 'PF', 4800 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP001';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'DEDUCTION', 'PT', 200 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP001';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'EARNING', 'Basic', 50000 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP002';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'EARNING', 'HRA', 20000 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP002';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'DEDUCTION', 'PF', 6000 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP002';

INSERT INTO payslip_lines (payslip_id, line_type, component, amount)
SELECT p.id, 'DEDUCTION', 'PT', 200 FROM payslips p
JOIN employees e ON e.id = p.employee_id WHERE e.employee_number = 'EMP002';

-- ------------------------------------------------------------
-- Leave types + allocations (matches src/services/leaveService.js)
-- ------------------------------------------------------------
INSERT INTO leave_types (code, name, default_allocation) VALUES
  ('PL', 'Paid Leave', 18),
  ('SL', 'Sick Leave', 12),
  ('UL', 'Unpaid Leave', 0);

INSERT INTO leave_allocations (employee_id, leave_type, allocated, used)
SELECT e.id, 'PL', 18, 6 FROM employees e WHERE e.employee_number = 'EMP001';

INSERT INTO leave_allocations (employee_id, leave_type, allocated, used)
SELECT e.id, 'PL', 18, 2 FROM employees e WHERE e.employee_number = 'EMP002';

INSERT INTO leave_allocations (employee_id, leave_type, allocated, used)
SELECT e.id, 'SL', 12, 1 FROM employees e WHERE e.employee_number = 'EMP002';

-- ------------------------------------------------------------
-- Working schedule (default Monday-Saturday work, Sunday off)
-- ------------------------------------------------------------
INSERT INTO working_schedule (employee_id, day_of_week, day_status)
SELECT e.id, d.day_of_week, CASE WHEN d.day_of_week = 0 THEN 'OFF' ELSE 'WORK' END
FROM employees e
CROSS JOIN generate_series(0, 6) AS d(day_of_week);

-- ------------------------------------------------------------
-- Policy documents (matches src/rag/policyStore.js)
-- ------------------------------------------------------------
INSERT INTO policy_documents (category, title, content, tags) VALUES
  ('LEAVE_POLICY', 'Leave Types and Allocation',
   'Employees receive 18 days of Paid Leave (PL) and 12 days of Sick Leave (SL) per year. Unpaid Leave (UL) is not allocated and is deducted from pay. Leave year runs January to December.',
   ARRAY['leave','allocation','paid leave','sick leave','unpaid leave','balance']),
  ('LEAVE_POLICY', 'Leave Application Rules',
   'Leave must be requested with the start date, end date and a short reason. Requests are created as PENDING_APPROVAL and require manager approval before leave is taken. Requests for more than 3 consecutive days require department-head approval.',
   ARRAY['leave','application','approval','pending approval','manager approval']),
  ('LEAVE_POLICY', 'Sick Leave Procedure',
   'Sick leave can be taken with a valid reason. For sick leave lasting more than 2 days, a medical certificate must be submitted to HR. Sick leave does not require prior manager approval, but must still be reported to HR.',
   ARRAY['sick leave','medical certificate','leave','absence']),
  ('LEAVE_POLICY', 'Unpaid Leave and Earnings',
   'Unpaid leave is deducted from the employee''s monthly pay on a per-day basis. The day rate is computed deterministically from the salary structure, never by estimation.',
   ARRAY['unpaid leave','deduction','loss of pay','lop','pay']),
  ('PAYROLL_RULES', 'Loss of Pay Calculation',
   'Loss of pay is the day rate multiplied by the number of unpaided leave days in the month. The day rate is the monthly gross divided by the number of working days in that month.',
   ARRAY['payroll','loss of pay','lop','deduction','day rate']),
  ('HANDBOOK', 'Employee Handbook — Attendance',
   'Working week is Monday to Saturday. Sunday is an off day. Official company holidays are announced by HR at the start of every year.',
   ARRAY['handbook','attendance','working days','schedule','holiday']);

COMMIT;