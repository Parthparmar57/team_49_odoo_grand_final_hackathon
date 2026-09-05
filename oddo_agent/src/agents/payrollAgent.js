/**
 * Payroll Agent.
 *
 * Handles payroll questions and explains payslips.
 *
 * The agent READS contracts, attendance, leave and payslip data through its
 * allowed tools and EXPLAINS the numbers. Actual payroll values come from the
 * deterministic payrollService — the LLM is never asked to calculate.
 *
 * Output is a draft response to the employee that HR reviews before sending.
 */
import { getEmployee } from "../services/employeeService.js";
import { getContract, getPayslip, getPayslipLines } from "../services/payrollService.js";

/**
 * @typedef {import("../services/payrollService.js").PayslipLines} PayslipLines
 */

/**
 * Explain a payslip in deterministic application logic (not LLM math).
 * Returns human-readable component lines.
 */
function explainPayslip(lines) {
  const earnings = lines.earnings
    .map(({ component, amount }) => `   - ${component}: ₹${amount}`)
    .join("\n");

  const deductions = lines.deductions
    .map(({ component, amount }) => `   - ${component}: ₹${amount}`)
    .join("\n");

  return `
Payslip for ${lines.month}
   Earnings:
${earnings}
   Deductions:
${deductions}
   Gross: ₹${lines.gross}
   Net:   ₹${lines.net}
`.trim();
}

export function runPayrollAgent(executionPlan) {
  console.log("\n========================================");
  console.log("PAYROLL AGENT");
  console.log("========================================");

  const employeeId = executionPlan.employee.id;
  const query = executionPlan.input.query;
  const period = executionPlan.input.payrollPeriod;

  console.log("Employee:", executionPlan.employee.name);
  console.log("Query:", query);
  console.log("Period:", period || "(latest)");

  // -----------------------------------------------
  // TOOL: getEmployee
  // -----------------------------------------------
  const employee = getEmployee(employeeId);
  if (!employee) {
    return { requestId: executionPlan.requestId, status: "EMPLOYEE_NOT_FOUND" };
  }
  console.log("✓ getEmployee:", employee.name);

  // -----------------------------------------------
  // TOOL: getContract
  // -----------------------------------------------
  const contract = getContract(employeeId);
  console.log("✓ getContract:", contract ? `${contract.type} ${contract.currency}` : "none");

  // -----------------------------------------------
  // TOOL: getPayslip + getPayslipLines
  // -----------------------------------------------
  const slip = getPayslip(employeeId, period);
  const lines = getPayslipLines(employeeId, period);

  if (!slip || !lines) {
    return {
      requestId: executionPlan.requestId,
      status: "NO_PAYSLIP_FOUND",
      message: `A payslip for this period was not found. The most recently generated payslips are available; please request the correct month.`,
    };
  }

  console.log(`✓ getPayslip: ${slip.month} net ₹${slip.net}`);

  // -----------------------------------------------
  // EXPLAIN (deterministic — no LLM calculation)
  // -----------------------------------------------
  const explanation = explainPayslip(lines);

  console.log("\n[EXPLANATION]");
  console.log(explanation);

  const hrMessage =
    `HR review requested — payroll inquiry from ${employee.name} (${employee.email}). ` +
    `Question: "${query}". ` +
    `Draft explanation prepared from the official ${slip.month} payslip (net ₹${slip.net}). ` +
    `Please review and approve before sending to the employee.`;

  return {
    requestId: executionPlan.requestId,
    status: "RESPONSE_DRAFT_TO_HR",
    employee: executionPlan.employee,
    payslip: {
      month: slip.month,
      gross: slip.gross,
      net: slip.net,
      earnings: lines.earnings,
      deductions: lines.deductions,
    },
    contract: contract
      ? { type: contract.type, currency: contract.currency, monthlyGross: contract.monthlyGross }
      : null,
    explanation,
    message: hrMessage,
    requiresHumanApproval: executionPlan.requiresHumanApproval,
    isReadOnly: true,
  };
}