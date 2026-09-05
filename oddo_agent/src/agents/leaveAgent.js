/**
 * Leave Agent.
 *
 * Executes the Orchestrator's execution plan for LEAVE_REQUEST intents.
 *
 * The agent checks live data through its allowed tools (from the execution
 * plan), consults company policy via RAG, then creates a PENDING_APPROVAL
 * request. It NEVER approves the request itself — human approval is the
 * authority for sensitive actions.
 *
 * All balance, overlap, scheduling and day-count logic is deterministic
 * (leaveService); the LLM is not involved in calculations.
 */
import { getEmployee } from "../services/employeeService.js";
import {
  getLeaveBalance,
  getExistingLeaveRequests,
  findOverlappingRequests,
  countLeaveDays,
  createLeaveRequest,
  parseDate,
} from "../services/leaveService.js";
import { getWorkingSchedule } from "../services/workingScheduleService.js";
import { searchPolicy } from "../rag/policyStore.js";

/** Descriptive labels used for policy retrieval (RAG keyword stand-in). */
const LEAVE_TYPE_LABELS = {
  PL: "Paid Leave",
  SL: "Sick Leave",
  UL: "Unpaid Leave",
};

// ============================================================
// VALIDATE EXECUTION PLAN (Zod)
// ============================================================

import { z } from "zod";

const ExecutionPlanSchema = z.object({
  requestId: z.string(),
  agent: z.string(),
  operation: z.string(),
  employee: z.object({
    id: z.string(),
    employeeNumber: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  input: z.object({
    intent: z.string(),
    leaveType: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    reason: z.string().nullable(),
    payrollPeriod: z.string().nullable(),
    query: z.string().nullable(),
  }),
  requiredChecks: z.array(z.string()),
  allowedTools: z.array(z.string()),
  requiresHumanApproval: z.boolean(),
  status: z.string(),
});

// ============================================================
// MAIN AGENT ENTRY
// ============================================================

export async function runLeaveAgent(executionPlan) {
  console.log("\n========================================");
  console.log("LEAVE AGENT");
  console.log("========================================");

  const parsed = ExecutionPlanSchema.safeParse(executionPlan);

  if (!parsed.success) {
    console.log("✗ Invalid execution plan:", parsed.error.issues);
    return {
      status: "INVALID_EXECUTION_PLAN",
      errors: parsed.error.issues,
    };
  }

  const plan = parsed.data;
  const employeeId = plan.employee.id;
  const { leaveType, startDate, endDate, reason } = plan.input;

  const checks = [];

  // ----------------------------------------------------------
  // CHECK 1 — EMPLOYEE EXISTS
  // ----------------------------------------------------------

  console.log("\n[CHECK] Employee exists");
  const employee = getEmployee(employeeId);

  if (!employee) {
    return { requestId: plan.requestId, status: "EMPLOYEE_NOT_FOUND", checks };
  }

  checks.push({ check: "employee_exists", result: "PASS" });
  console.log("✓ Employee:", employee.name, "(", employee.status + ")");

  // ----------------------------------------------------------
  // CHECK 2 — LEAVE BALANCE
  // ----------------------------------------------------------

  console.log("\n[CHECK] Leave balance");
  const balance = getLeaveBalance(employeeId, leaveType);

  checks.push({
    check: "leave_balance",
    result: balance.found ? "PASS" : "FAIL",
    data: balance,
  });

  console.log("  Balance:", JSON.stringify(balance));

  // ----------------------------------------------------------
  // CHECK 3 — EXISTING LEAVE REQUESTS / OVERLAP
  // ----------------------------------------------------------

  console.log("\n[CHECK] Existing leave requests / overlap");

  const existingRequests = getExistingLeaveRequests(employeeId);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const overlapping = start && end ? findOverlappingRequests(employeeId, start, end) : [];

  checks.push({
    check: "existing_leave_requests",
    result: overlapping.length === 0 ? "PASS" : "FAIL",
    existing: existingRequests,
    overlapping,
  });

  console.log("  Existing requests:", existingRequests.length);

  if (overlapping.length > 0) {
    console.log("✗ Overlap detected:", JSON.stringify(overlapping));
    return {
      requestId: plan.requestId,
      status: "REJECTED_OVERLAP",
      employee: plan.employee,
      balance,
      overlapping,
      checks,
    };
  }

  console.log("✓ No overlapping requests");

  // ----------------------------------------------------------
  // CHECK 4 — WORKING SCHEDULE
  // ----------------------------------------------------------

  console.log("\n[CHECK] Working schedule");

  if (!start || !end) {
    return {
      requestId: plan.requestId,
      status: "INVALID_DATES",
      message: "Could not interpret start/end dates.",
      rawDates: { startDate, endDate },
      checks,
    };
  }

  if (end < start) {
    return {
      requestId: plan.requestId,
      status: "INVALID_DATES",
      message: "End date must not be before start date.",
      checks,
    };
  }

  const schedule = getWorkingSchedule(employeeId);
  const { days, workingDates } = countLeaveDays(employeeId, start, end);

  checks.push({
    check: "working_schedule",
    result: days > 0 ? "PASS" : "FAIL",
    schedule,
    workingDates,
  });

  console.log("  Schedule:", JSON.stringify(schedule));
  console.log("  Leave days (working days):", days);

  if (days <= 0) {
    console.log("✗ Requested period contains no working days");
    return {
      requestId: plan.requestId,
      status: "REJECTED_NO_WORKING_DAYS",
      employee: plan.employee,
      checks,
    };
  }

  // ----------------------------------------------------------
  // CHECK 5 — LEAVE POLICY (RAG, not live truth)
  // ----------------------------------------------------------

  console.log("\n[CHECK] Leave policy (RAG)");

  const policyQuery = `${LEAVE_TYPE_LABELS[leaveType] || leaveType} ${reason || ""} leave policy`;

  const policyResults = searchPolicy(policyQuery, "LEAVE_POLICY", 3);

  checks.push({
    check: "leave_policy",
    result: policyResults.length > 0 ? "PASS" : "WARN",
    matches: policyResults,
  });

  console.log("  Policy matches:", policyResults.length);
  for (const doc of policyResults) {
    console.log("   -", doc.title, "(score", doc.score + ")");
  }

  // ----------------------------------------------------------
  // CHECK 6 — SUFFICIENT BALANCE (deterministic)
  // ----------------------------------------------------------

  console.log("\n[CHECK] Sufficient balance");

  checks.push({
    check: "insufficient_balance",
    result: days <= balance.remaining ? "PASS" : "FAIL",
    requested: days,
    available: balance.remaining,
  });

  if (days > balance.remaining) {
    console.log(
      `✗ ${days} day(s) requested but only ${balance.remaining} available`
    );
    return {
      requestId: plan.requestId,
      status: "REJECTED_INSUFFICIENT_BALANCE",
      employee: plan.employee,
      balance,
      requestedDays: days,
      checks,
    };
  }

  console.log(`✓ ${days} day(s) requested, ${balance.remaining} available`);

  // ----------------------------------------------------------
  // CREATE PENDING_APPROVAL REQUEST
  // The agent creates the request only. Human approval is required
  // before the leave is effective (ensured by the Orchestrator).
  // ----------------------------------------------------------

  console.log("\n[CREATE] PENDING_APPROVAL leave request");

  const created = createLeaveRequest({
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    reason,
  });

  console.log("✓ Request created:", created.id, "(", created.requestNumber + ")");
  console.log("  Status: PENDING_APPROVAL");
  console.log("  Days:", created.days, JSON.stringify(created.workingDates));

  return {
    requestId: plan.requestId,
    status: "PENDING_APPROVAL",
    employee: plan.employee,
    balanceAfterRequest: getLeaveBalance(employeeId, leaveType),
    leaveRequest: created,
    policyContext: policyResults,
    message:
      `HR approval required — ${employee.name} (${employee.email}) requests ${leaveType} ` +
      `from ${created.startDate} to ${created.endDate} (${created.days} working days). ` +
      `Reason: ${reason || "not provided"}. Balance after request: ${getLeaveBalance(employeeId, leaveType).remaining} days. ` +
      `Please approve or reject request ${created.requestNumber}.`,
    requiresHumanApproval: plan.requiresHumanApproval,
    nextStep: "route_to_human_approval_queue",
    checks,
  };
}