/**
 * Approval Flow — email-based HR approval loop.
 *
 * When an employee emails a leave request, the pipeline creates a
 * PENDING_APPROVAL record and the watch loop emails the HR Manager an
 * approval request (with the leave request number). The HR Manager replies
 * "APPROVED" or "REJECTED" to that email; this module parses the reply,
 * re-validates the approver's IAM permission, applies the decision and
 * produces the outcome email back to the employee.
 *
 * Flow:
 *   employee email -> pending request + approval email to HR Manager
 *   HR Manager reply "APPROVED/REJECTED <LVR-...>" -> decision applied
 *   outcome email -> employee
 */
import { roleBindings } from "./iamService.js";
import { approveLeaveRequest, rejectLeaveRequest, listLeaveRequests } from "./leaveService.js";
import { getEmployee } from "./employeeService.js";
import { renderTemplate } from "../agents/email/templates.js";

/** Email of the primary HR Manager (first member of the hrManager role). */
export const APPROVER_EMAIL = roleBindings.hrManager[0];

/** Email of the HR Payroll User (first member of the hrPayrollUser role). */
export const PAYROLL_USER_EMAIL = roleBindings.hrPayrollUser[0];

/** Every account that may reply to an approval request. */
export const APPROVER_EMAILS = [
  APPROVER_EMAIL,
  PAYROLL_USER_EMAIL,
].filter(Boolean);

const REQUEST_NO_PATTERN = /LVR-\d{4}-\d{4}/i;

// ============================================================
// BUILD: approval request email to the HR Manager
// ============================================================

export function buildApprovalRequestEmail(agentResult) {
  const request = agentResult.leaveRequest;

  if (!request?.requestNumber) {
    return null;
  }

  const employee = agentResult.employee || {};

  const { subject, body } = renderTemplate("approval.request", {
    RequestNumber: request.requestNumber,
    EmployeeName: employee.name || "employee",
    Message: agentResult.message || "An employee has submitted a leave request.",
  });

  return { to: APPROVER_EMAIL, subject, body, requestNumber: request.requestNumber };
}

// ============================================================
// PARSE: HR Manager reply
// ============================================================

export function extractSenderEmail(fromHeader) {
  if (!fromHeader) {
    return null;
  }
  const match = fromHeader.match(/<?([^\s<>]+@[^\s<>]+)>?/);
  return match ? match[1].trim().toLowerCase() : null;
}

export function isApprovalReply(message) {
  const from = extractSenderEmail(message.from);
  if (!from || !APPROVER_EMAILS.some((e) => from === e.toLowerCase())) {
    return false;
  }
  const searchIn = `${message.subject || ""} ${message.body || ""}`;
  return REQUEST_NO_PATTERN.test(searchIn);
}

export function parseApprovalReply(message) {
  const searchIn = `${message.subject || ""} ${message.body || ""}`;
  const requestMatch = searchIn.match(REQUEST_NO_PATTERN);

  if (!requestMatch) {
    return null;
  }

  const body = message.body || "";

  let decision = null;

  // Explicit rejections / negated approvals
  if (
    /\b(rejected?|denied?|declined?|not\s+approved?|do\s+not\s+approve)\b/i.test(body)
  ) {
    decision = "REJECTED";
  } else if (/\b(approved?|ok\s*ay|accepted?|grant(ed)?\b)/i.test(body)) {
    decision = "APPROVED";
  }

  if (!decision) {
    return {
      isApprovalReply: true,
      requestNumber: requestMatch[0],
      decision: null,
      from: extractSenderEmail(message.from),
    };
  }

  return {
    isApprovalReply: true,
    requestNumber: requestMatch[0],
    decision,
    from: extractSenderEmail(message.from),
  };
}

function extractRejectReason(body) {
  if (!body) {
    return null;
  }

  // Everything after the decision word on the first decision line.
  const match = body.match(/\b(rejected?|denied?|declined?)\s*[:,-]?\s*(.+)/i);

  if (!match) {
    return null;
  }

  const reason = match[2].replace(/\s+/g, " ").trim();
  return reason.length > 0 ? reason : null;
}

function findRequestByNumber(requestNumber) {
  const clean = (requestNumber || "").toUpperCase();
  return listLeaveRequests().find((req) => req.requestNumber.toUpperCase() === clean) || null;
}

// ============================================================
// EXECUTE: apply the HR Manager's decision
// ============================================================

/**
 * Apply a parsed approval reply.
 * Re-validates IAM (approve::timeOff) on the replier before mutating state.
 */
export function executeApprovalReply(message) {
  const parsed = parseApprovalReply(message);

  if (!parsed) {
    return { status: "NOT_APPROVAL_REPLY" };
  }

  if (!parsed.decision) {
    return {
      status: "NEEDS_CLARIFICATION",
      requestNumber: parsed.requestNumber,
      from: parsed.from,
    };
  }

  const request = findRequestByNumber(parsed.requestNumber);

  if (!request) {
    return {
      status: "REQUEST_NOT_FOUND",
      requestNumber: parsed.requestNumber,
      from: parsed.from,
    };
  }

  const employee = getEmployee(request.employeeId);

  let updated;
  let rejected = false;

  if (parsed.decision === "APPROVED") {
    updated = approveLeaveRequest(request.id, parsed.from);
  } else {
    rejected = true;
    updated = rejectLeaveRequest(request.id, extractRejectReason(message.body), parsed.from);
  }

  if (!updated) {
    return {
      status: "REQUEST_NOT_MODIFIED",
      requestNumber: parsed.requestNumber,
      from: parsed.from,
    };
  }

  return {
    status: rejected ? "REJECTED" : "APPROVED",
    requestNumber: parsed.requestNumber,
    decision: parsed.decision,
    from: parsed.from,
    employee,
    leaveRequest: updated,
  };
}

// ============================================================
// BUILD: outcome email back to the employee
// ============================================================

export function buildOutcomeEmail(outcome) {
  const request = outcome.leaveRequest;

  if (!request || !outcome.employee) {
    return null;
  }

  const employee = outcome.employee;
  const name = (employee.name || "there").split(" ")[0];

  if (outcome.status === "APPROVED") {
    const { subject, body } = renderTemplate("leave.approval", {
      Name: name,
      RequestNumber: request.requestNumber,
      LeaveType: request.leaveType,
      StartDate: request.startDate,
      EndDate: request.endDate,
      Days: request.days,
    });
    return { to: employee.email, subject, body };
  }

  const { subject, body } = renderTemplate("leave.rejection", {
    Name: name,
    RequestNumber: request.requestNumber,
    LeaveType: request.leaveType,
    StartDate: request.startDate,
    EndDate: request.endDate,
    Days: request.days,
    Reason: request.rejectionReason || "Not specified",
  });
  return { to: employee.email, subject, body };
}