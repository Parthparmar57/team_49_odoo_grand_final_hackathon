/**
 * Email reply templates for PeoplePay360.
 *
 * Each template is a pure function that takes the data it needs and returns
 * either a plain reply body (used with sendReply) or an object
 * { subject, body } (used with sendEmail). Keeping the templates as functions
 * means the caller decides the subject/format while the wording stays in one
 * place.
 *
 * Convention:
 *   - reply templates -> return a string body (thread subject is reused).
 *   - standalone templates -> return { subject, body }.
 *
 * A `renderTemplate(key, data)` bridge is also exported so existing callers
 * that use dotted keys (e.g. "leave.approval", "hr.ack") keep working; it maps
 * those keys onto the named functions below.
 *
 * Every function is deterministic: no LLM, no side effects.
 */

const SIGN = "PeoplePay360 HR Team";

function body(greeting, content, sign = SIGN) {
  return `${greeting}\n\n${content}\n\nRegards,\n${sign}`;
}

function firstName(employee) {
  const name = employee?.name;
  return typeof name === "string" && name ? name.split(" ")[0] : "there";
}

// ============================================================
// LEAVE
// ============================================================

/** Employee is told their leave request has been received. */
export function leaveRequestReceived({ employee, requestNo } = {}) {
  const name = firstName(employee);
  const no = requestNo || "";
  return body(
    `Hi ${name},`,
    `Your leave request ${no} has been received and is now pending approval from the HR team. We'll notify you once it's resolved.`
  );
}

/** Approval outcome notification. Works as a reply OR standalone email. */
export function leaveApproved({ employee, request, requestNo = request?.requestNumber, name, requestNumber, leaveType, startDate, endDate, days } = {}) {
  const toName = name || firstName(employee);
  const no = requestNumber || requestNo || "";
  const period = leaveType && startDate && endDate
    ? `(${leaveType} from ${startDate} to ${endDate}, ${days ?? "?"} day(s))`
    : "";
  const lines = [
    `Good news! Your leave request ${no} ${period}`.replace(/\s+/g, " ").trim(),
    `has been APPROVED.`,
  ].join(" ");

  return {
    subject: `Approved: Leave request ${no}`,
    body: body(`Hi ${toName},`, lines),
  };
}

/** Rejection outcome notification. */
export function leaveRejected({ employee, request, requestNo = request?.requestNumber, name, requestNumber, leaveType, startDate, endDate, days, reason } = {}) {
  const toName = name || firstName(employee);
  const no = requestNumber || requestNo || "";
  const period = leaveType && startDate && endDate
    ? `(${leaveType} from ${startDate} to ${endDate}, ${days ?? "?"} day(s))`
    : "";
  const rejectionReason = reason || request?.rejectionReason || null;

  const content =
    `We are sorry to inform you that your leave request ${no} ${period.trim()} ` +
    `has been REJECTED${rejectionReason ? ` for the following reason:\n\n${rejectionReason}` : ".\n\n"} ` +
    `Please contact HR if you would like to discuss it.`;

  return {
    subject: `Rejected: Leave request ${no}`,
    body: body(`Hi ${toName},`, content),
  };
}

/** Clarification email asking for the missing fields. */
export function leaveClarification({ employee, missingFields = [], name, missing } = {}) {
  const toName = name || firstName(employee) || "there";
  const fields = missingFields.length
    ? missingFields.map((f) => `- ${f}`).join("\n")
    : (missing || "");

  return body(
    `Dear ${toName},`,
    `We received your HR request, but some information is missing before we can process it.\n\nPlease provide the following:\n\n${fields}\n\nOnce we receive the missing information, your request can continue through the PeoplePay360 workflow.`
  );
}

// ============================================================
// PAYROLL / SALARY
// ============================================================

/** Payslip breakdown reply (from the deterministic PayrollAgent). */
export function payslipReply({ employee, explanation, name, breakdown } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `Here is the breakdown of your payslip:\n\n${explanation || breakdown || ""}\n\nIf you have any further questions, feel free to reach out.`
  );
}

/** Payslip not found for the requested month. */
export function noPayslipFound({ employee, month, name } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `We could not find a payslip for the month you mentioned (${month || "that period"}). Please make sure the month is correct and try again, or let us know which month you'd like the breakdown for.`
  );
}

/** Full salary structure explanation. */
export function salaryStructureReply({ employee, breakdown, structure, month, net } = {}) {
  const name = firstName(employee);
  return body(
    `Hi ${name},`,
    `Here is your salary structure:\n\n${breakdown || structure || ""}` +
      (net ? `\n\nYour net take-home for ${month || "the month"} is ${net}.` : "") +
      `\n\nIf you have any further questions, feel free to reach out.`
  );
}

// ============================================================
// REFERENCE / VERIFICATION
// ============================================================

/** Employment verification for a third party (bank / next employer). */
export function employmentVerification({
  requesterName,
  employeeName,
  designation,
  from,
  to,
  lastSalary,
  conduct = "",
  joiningDate,
  leavingDate,
} = {}) {
  return body(
    `Dear ${requesterName || "Sir/Madam"},`,
    `This is to confirm that ${employeeName || "the employee"} was employed with our organization ` +
      `from ${from || joiningDate || "-"} to ${to || leavingDate || "present"} as ${designation || "an employee"}.` +
      (lastSalary ? ` Last drawn monthly salary: ₹${lastSalary}.` : "") +
      (conduct ? ` Conduct during tenure: ${conduct}.` : "") +
      `\n\nThis letter is issued on request for official purposes.`
  );
}

/** Ask a referee to confirm a candidate's details. */
export function referenceCheckRequest({ refereeName, candidateName, role, jobTitle } = {}) {
  return body(
    `Hi ${refereeName || "there"},`,
    `${candidateName || "A candidate"} has applied for ${role || jobTitle || "a role"} with us and listed you as a reference. ` +
      `Could you kindly confirm their tenure, role and conduct? A brief reply is fine.`
  );
}

// ============================================================
// RESUME / APPLICATIONS
// ============================================================

/** Resume received, under review. */
export function applicationReceived({ name, role, jobTitle } = {}) {
  return body(
    `Hi ${name || "there"},`,
    `Thank you for applying for ${role || jobTitle || "the role"}. Your resume has been received and is under review. ` +
      `We'll contact you if your profile matches our requirement.`
  );
}

/** Candidate shortlisted. */
export function applicationShortlisted({ name, role, jobTitle } = {}) {
  return body(
    `Hi ${name || "there"},`,
    `We are pleased to inform you that your profile has been shortlisted for ${role || jobTitle || "the role"}. ` +
      `Our team will reach out shortly to schedule the next steps.`
  );
}

/** Candidate not shortlisted. */
export function applicationRejected({ name, role, jobTitle } = {}) {
  return body(
    `Hi ${name || "there"},`,
    `Thank you for applying for ${role || jobTitle || "the role"}. After careful review, we have decided not to proceed ` +
      `with your application at this time. We encourage you to apply again in the future.`
  );
}

// ============================================================
// RECRUITMENT / INTERVIEW
// ============================================================

/** Interview invitation. */
export function interviewSchedule({ name, role, jobTitle, date, time, mode, interviewDate, interviewTime, interviewMode } = {}) {
  return {
    subject: `Interview Invite — ${role || jobTitle || "Role"}`,
    body: body(
      `Hi ${name || "there"},`,
      `Congratulations on being shortlisted for ${role || jobTitle || "the role"}. Your interview is scheduled for ` +
        `${date || interviewDate || "TBD"} at ${time || interviewTime || "TBD"} (${mode || interviewMode || "online"}). Please confirm your availability.`
    ),
  };
}

/** Job offer (standalone email). */
export function jobOffer({ name, role, jobTitle, company, salary, joinDate, responseBy, joiningDate, responseDate } = {}) {
  return {
    subject: `Offer of Employment — ${role || jobTitle || "Role"}`,
    body: body(
      `Hi ${name || "there"},`,
      `We are pleased to offer you the position of ${role || jobTitle || "the role"} at ${company || "our company"}.` +
        (salary ? ` Monthly salary: ₹${salary}.` : "") +
        (joinDate || joiningDate ? ` Expected joining date: ${joinDate || joiningDate}.` : "") +
        (responseBy || responseDate ? ` Please confirm your acceptance by ${responseBy || responseDate}.` : "")
    ),
  };
}

/** Post-interview rejection. */
export function postInterviewRejection({ name, role, jobTitle } = {}) {
  return body(
    `Hi ${name || "there"},`,
    `Thank you for attending the interview for ${role || jobTitle || "the role"}. While your qualifications are impressive, ` +
      `we have decided to move forward with another candidate this time. We wish you success and encourage you ` +
      `to apply for future openings.`
  );
}

// ============================================================
// GENERAL HR QUERIES (attendance, policies, onboarding, exit…)
// ============================================================

/** Generic answer to any HR/policy query. */
export function generalQueryReply({ employee, topic, answer } = {}) {
  const name = firstName(employee);
  return body(
    `Hi ${name},`,
    `Thank you for your query about ${topic || "this matter"}.\n\n${answer || "Please contact HR for details."}`
  );
}

// ============================================================
// STATUS / MISC
// ============================================================

/** Generic "received & being processed" acknowledgement. */
export function requestReceived({ employee, name } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `Thank you for your HR request. It has been received and is being processed by our PeoplePay360 workflow.`
  );
}

/** Employee could not be identified. */
export function employeeNotFound({ employeeEmail, name } = {}) {
  return body(
    `Hi ${name || employeeEmail || "there"},`,
    `We could not identify you in our employee records with the email address you wrote your request from. ` +
      `If this is an error, please contact HR directly so we can help.`
  );
}

/** Authorization denied. */
export function unauthorized({ employeeEmail, name } = {}) {
  return body(
    `Hi ${name || employeeEmail || "there"},`,
    `We could not process your request. Your account does not have access to this feature. ` +
      `If you believe this is a mistake, please contact HR directly.`
  );
}

/** Leave overlap rejection. */
export function leaveOverlapRejected({ employee, name } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `Your leave request overlaps with an existing leave request on our records, so it could not be processed. ` +
      `Please contact HR if you believe this is a mistake.`
  );
}

/** Insufficient leave balance rejection. */
export function leaveInsufficientBalance({ employee, name } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `Unfortunately you do not have enough leave balance for the dates you requested, so this request could ` +
      `not be processed. Please contact HR to discuss your options.`
  );
}

/** Dates in the request could not be understood. */
export function invalidDates({ employee, name } = {}) {
  const toName = name || firstName(employee);
  return body(
    `Hi ${toName},`,
    `We had trouble understanding the dates in your request. Please provide your leave dates clearly ` +
      `(for example: 15 September to 16 September) and try again.`
  );
}

/** Fallback when nothing else matches. */
export function unableToProcess({ employeeEmail, name } = {}) {
  return body(
    `Hi ${name || employeeEmail || "there"},`,
    `We could not process your request at this time. Please try again or contact HR directly.`
  );
}

/** Generic unexpected technical error. */
export function technicalError({ employeeEmail, name } = {}) {
  return body(
    `Hi ${name || employeeEmail || "there"},`,
    `We received your request but encountered a technical issue processing it. Our team has been notified.`
  );
}

/** Approval request sent to HR for a decision. */
export function approvalRequest({ requestNumber, employeeName, message } = {}) {
  return {
    subject: `[APPROVAL REQUEST] Leave request ${requestNumber || ""} from ${employeeName || "employee"}`,
    body: body(
      `Hi,`,
      `${message || "An employee has submitted a leave request."}\n\nReply to this email with:\n` +
        `  APPROVED          - to approve this leave request\n` +
        `  REJECTED <reason> - to reject it (optionally with a reason)`
    ),
  };
}

/** Approval decision could not be parsed. */
export function decisionUnparseable() {
  return body(
    `Hi,`,
    `We could not understand your decision. Please reply with APPROVED or REJECTED <reason>.`
  );
}

/** Generic message wrapper (uses `message` as the body content). */
export function genericReply({ name, message } = {}) {
  return body(
    `Hi ${name || "there"},`,
    message || "We could not process your request at this time. Please try again or contact HR directly."
  );
}

// ============================================================
// BRIDGE: renderTemplate(key, data) -> { subject, body }
// Maps dotted keys to the named functions above so existing
// callers (approvalFlow, completeness, watch) keep working.
// ============================================================

const toBody = (fn) => (data) => {
  const out = fn(data);
  return typeof out === "string" ? { subject: "Re: Your Request", body: out } : out;
};

const KEY_MAP = {
  "leave.approval": toBody((d) => leaveApproved({
    name: d.Name, requestNumber: d.RequestNumber,
    leaveType: d.LeaveType, startDate: d.StartDate, endDate: d.EndDate, days: d.Days,
  })),
  "leave.rejection": toBody((d) => leaveRejected({
    name: d.Name, requestNumber: d.RequestNumber,
    leaveType: d.LeaveType, startDate: d.StartDate, endDate: d.EndDate, days: d.Days,
    reason: d.Reason,
  })),
  "leave.pendingApproval": toBody((d) => leaveRequestReceived({
    name: d.Name, requestNo: d.RequestNumber,
  })),
  "leave.clarification": toBody((d) => leaveClarification({
    name: d.Name, missing: d.MissingFields,
  })),
  "payroll.payslipExplanation": toBody((d) => payslipReply({
    name: d.Name, breakdown: d.Breakdown,
  })),
  "payroll.payslipNotFound": toBody((d) => noPayslipFound({
    name: d.Name, month: d.Month,
  })),
  "approval.request": toBody((d) => approvalRequest({
    requestNumber: d.RequestNumber, employeeName: d.EmployeeName, message: d.Message,
  })),
  "approval.decisionUnparseable": toBody(() => decisionUnparseable()),
  "hr.ack": toBody((d) => requestReceived({ name: d.Name })),
  "hr.employeeNotFound": toBody((d) => employeeNotFound({ name: d.Name })),
  "hr.unauthorized": toBody((d) => unauthorized({ name: d.Name })),
  "hr.rejectedOverlap": toBody((d) => leaveOverlapRejected({ name: d.Name })),
  "hr.rejectedInsufficientBalance": toBody((d) => leaveInsufficientBalance({ name: d.Name })),
  "hr.invalidDates": toBody((d) => invalidDates({ name: d.Name })),
  "hr.generic": toBody((d) => genericReply({ name: d.Name, message: d.Message })),
  "hr.error": toBody((d) => technicalError({ name: d.Name })),
};

/**
 * Render a template by dotted key (e.g. "leave.approval") with data.
 * For advanced/maintenance use; most new code should call the named functions.
 */
export function renderTemplate(key, data = {}) {
  const render = KEY_MAP[key];
  if (!render) {
    throw new Error(`Unknown template key: ${key}`);
  }
  return render(data);
}

export default {
  leaveRequestReceived,
  leaveApproved,
  leaveRejected,
  leaveClarification,
  payslipReply,
  noPayslipFound,
  salaryStructureReply,
  employmentVerification,
  referenceCheckRequest,
  applicationReceived,
  applicationShortlisted,
  applicationRejected,
  interviewSchedule,
  jobOffer,
  postInterviewRejection,
  generalQueryReply,
  requestReceived,
  employeeNotFound,
  unauthorized,
  leaveOverlapRejected,
  leaveInsufficientBalance,
  invalidDates,
  unableToProcess,
  technicalError,
  approvalRequest,
  decisionUnparseable,
  genericReply,
  renderTemplate,
};