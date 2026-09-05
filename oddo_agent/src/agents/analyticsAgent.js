/**
 * Analytics Agent.
 *
 * Provides read-only HR/payroll analytics. Queries controlled aggregate data
 * through its allowed tools and drafts an HR-facing message. The agent can
 * never modify records.
 */
import { getEmployee } from "../services/employeeService.js";
import { getPayrollMetrics, getAttendanceMetrics, getLeaveMetrics } from "../services/analyticsService.js";

export function runAnalyticsAgent(executionPlan) {
  console.log("\n========================================");
  console.log("ANALYTICS AGENT");
  console.log("========================================");

  const employeeId = executionPlan.employee.id;
  const query = executionPlan.input.query || "";
  const period = executionPlan.input.payrollPeriod || "2026-07";

  console.log("Requested by:", executionPlan.employee.name);
  console.log("Query:", query);
  console.log("Period:", period);

  // -----------------------------------------------
  // TOOL: getEmployee
  // -----------------------------------------------
  const employee = getEmployee(employeeId);
  if (!employee) {
    return { requestId: executionPlan.requestId, status: "EMPLOYEE_NOT_FOUND" };
  }
  console.log("✓ getEmployee:", employee.name);

  // -----------------------------------------------
  // TOOLS: aggregate reads (read-only)
  // -----------------------------------------------
  const payrollMetrics = getPayrollMetrics(period);
  const attendanceMetrics = getAttendanceMetrics(period);
  const leaveMetrics = getLeaveMetrics(period);

  console.log("✓ getPayrollMetrics:", JSON.stringify(payrollMetrics, null, 2));
  console.log("✓ getAttendanceMetrics:", JSON.stringify(attendanceMetrics, null, 2));
  console.log("✓ getLeaveMetrics:", JSON.stringify(leaveMetrics, null, 2));

  const hrMessage =
    `HR review requested — analytics inquiry from ${employee.name} for ${period}. ` +
    `Month payroll cost ₹${payrollMetrics.payrollCost} across ${payrollMetrics.employeeCount} employees; ` +
    `average attendance ${attendanceMetrics.averageMonthlyAttendance}%; ` +
    `${leaveMetrics.pendingApprovals} pending leave approvals. ` +
    `Draft response prepared from read-only aggregate data. Please review and approve before responding.`;

  return {
    requestId: executionPlan.requestId,
    status: "RESPONSE_DRAFT_TO_HR",
    employee: executionPlan.employee,
    period,
    metrics: {
      payroll: payrollMetrics,
      attendance: attendanceMetrics,
      leave: leaveMetrics,
    },
    message: hrMessage,
    requiresHumanApproval: executionPlan.requiresHumanApproval,
    isReadOnly: true,
    audit: "query_scope: read_only_aggregates",
  };
}