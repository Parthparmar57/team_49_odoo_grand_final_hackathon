/**
 * Analytics service.
 *
 * Read-only HR/payroll aggregates for the Analytics Agent. Stand-in for
 * PostgreSQL aggregate views. The Analytics Agent can never modify records.
 */

// Reuse demo payroll data previously loaded once.
import { getEmployee, getAllEmployees } from "./employeeService.js";
import { getContract } from "./payrollService.js";
import { getExistingLeaveRequests } from "./leaveService.js";

export function getPayrollMetrics(period = "2026-06") {
  const employees = getAllEmployees();

  const rows = employees.map((emp) => ({
    employee: emp.name,
    gross: getContract(emp.id)?.monthlyGross || 0,
  }));

  const payrollCost = rows.reduce((sum, row) => sum + row.gross, 0);

  return {
    period,
    employeeCount: rows.length,
    payrollCost,
    perEmployee: rows,
  };
}

export function getAttendanceMetrics(period = "2026-07") {
  // Demo aggregate stand-in. Replace with SQL SUM/AVG over attendance table.
  return {
    period,
    averageMonthlyAttendance: 96,
    absentEmployeeCount: 1,
    notes: "Company-wide average attendance percentage for the period.",
  };
}

export function getLeaveMetrics(period = "2026-07") {
  const allRequests = getAllEmployees().flatMap((emp) =>
    getExistingLeaveRequests(emp.id).map((req) => ({
      employee: req.employeeName,
      leaveType: req.leaveType,
      days: req.days,
      status: req.status,
    }))
  );

  return {
    period,
    totalRequests: allRequests.length,
    pendingApprovals: allRequests.filter((r) => r.status === "PENDING_APPROVAL").length,
    approved: allRequests.filter((r) => r.status === "APPROVED").length,
    details: allRequests,
  };
}