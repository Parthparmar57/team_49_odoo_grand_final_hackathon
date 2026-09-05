import "dotenv/config";
import { listUnreadMentions, markRead, sendReply, sendEmail } from "./lib/gmailService.js";
import { emailIntelligenceAgent } from "./agents/emailAgent.js";
import { runOrchestrator } from "./agents/hrOrchestrator.js";
import { runLeaveAgent } from "./agents/leaveAgent.js";
import { runPayrollAgent } from "./agents/payrollAgent.js";
import { runAnalyticsAgent } from "./agents/analyticsAgent.js";
import { findEmployeeByEmail } from "./services/employeeService.js";
import {
  leaveRequestReceived,
  payslipReply,
  noPayslipFound,
  requestReceived,
  employeeNotFound,
  unauthorized,
  leaveOverlapRejected,
  leaveInsufficientBalance,
  invalidDates,
  unableToProcess,
  decisionUnparseable,
  technicalError,
} from "./agents/email/templates.js";
import {
  APPROVER_EMAIL,
  isApprovalReply,
  parseApprovalReply,
  executeApprovalReply,
  buildApprovalRequestEmail,
  buildOutcomeEmail,
} from "./services/approvalFlow.js";

// Process every unread request in a single run so each sender gets their own
// reply immediately (no cap).
const MAX_EMAILS = Infinity;

// ============================================================
// HELPERS
// ============================================================

function buildRawEmail(message) {
  return `From: ${message.from}\nSubject: ${message.subject || ""}\n\n${message.body}`;
}

function senderAddress(message) {
  const parsed = (message.from || "").match(/<?([^\s<>]+@[^\s<>]+)>?/);
  return parsed ? parsed[1].toLowerCase() : null;
}

/**
 * The completeness step returns a full email draft (with a "Subject:" line).
 * When used as the body of a reply, that header line is dropped.
 */
function replyBodyOnly(clarificationEmail) {
  if (!clarificationEmail) return clarificationEmail;
  return clarificationEmail.replace(/^.*Subject:\s*[^\n]*\n+/i, () => "").trim();
}

const REQUEST_KEYWORDS = [
  "leave request", "leave", "paid leave", "sick leave", "annual leave",
  "day off", "vacation", "take off", "need to take",
  "payroll", "salary", "payslip", "salary slip", "pf", "provident",
  "attendance", "analytics", "apply for", "i would like to", "i want",
  "i need", "salary difference",
];

const isRequestEmail = (message) => {
  const searchIn = `${message.subject || ""} ${message.body || ""}`.toLowerCase();
  return REQUEST_KEYWORDS.some((kw) => searchIn.includes(kw));
};

const isHumanSender = (message) => {
  const from = (message.from || "").toLowerCase();
  const blocked = [
    "noreply", "no-reply", "notifications", "newsletter", "marketing",
    "info@", "team@", "mail@", "comms.", "jobs@", "jobs.",
  ];
  return !blocked.some((b) => from.includes(b));
};

const isCandidate = (message) => {
  const knownEmployee = senderAddress(message) ? findEmployeeByEmail(senderAddress(message)) !== null : false;
  return knownEmployee || (isHumanSender(message) && isRequestEmail(message));
};

function buildReply(agentResult, employeeEmail = null) {
  const employee = agentResult.employee;
  const name =
    (employee?.name || "").split(" ")[0] || (employeeEmail || "there");
  const emp = { name, email: employeeEmail };

  switch (agentResult.status) {
    case "READY":
      return requestReceived({ employee: emp });

    case "PENDING_APPROVAL": {
      const requestNo = agentResult.leaveRequest?.requestNumber || "";
      return leaveRequestReceived({ employee: emp, requestNo });
    }

    case "RESPONSE_DRAFT_TO_HR":
      return payslipReply({ employee: emp, explanation: agentResult.explanation || "" });

    case "NO_PAYSLIP_FOUND":
      return noPayslipFound({ employee: emp, month: agentResult.message || "" });

    case "EMPLOYEE_NOT_FOUND":
      return employeeNotFound({ name, employeeEmail });

    case "UNAUTHORIZED":
      return unauthorized({ name, employeeEmail });

    case "REJECTED_OVERLAP":
      return leaveOverlapRejected({ employee: emp });

    case "REJECTED_INSUFFICIENT_BALANCE":
      return leaveInsufficientBalance({ employee: emp });

    case "INVALID_DATES":
      return invalidDates({ employee: emp });

    default:
      return unableToProcess({
        name,
        employeeEmail,
        message: agentResult.message,
      });
  }
}

// ============================================================
// APPROVAL REPLIES
// ============================================================

async function processApprovalReplies(messages) {
  let processed = 0;

  for (const message of messages) {
    if (!isApprovalReply(message)) {
      continue;
    }

    console.log("\n" + "-".repeat(50));
    console.log(`[APPROVAL REPLY] from ${message.from}`);
    console.log(`Subject: ${message.subject}`);

    const parsed = parseApprovalReply(message);

    if (parsed?.decision) {
      console.log(`Decision: ${parsed.decision} for ${parsed.requestNumber}`);

      const outcome = executeApprovalReply(message);

      if (outcome.status === "APPROVED" || outcome.status === "REJECTED") {
        const notice = buildOutcomeEmail(outcome);

        if (notice) {
          await sendEmail(notice);
          console.log(`✓ Outcome email sent to ${notice.to}`);
        }
      } else {
        console.log(`→ No state change: ${outcome.status}`);
      }

      processed += 1;
    } else {
      console.log("→ Decision unparseable, asking HR Manager to clarify.");

      await sendReply(message, decisionUnparseable());
      processed += 1;
    }

    await markRead(message.id);
  }

  return processed;
}

// ============================================================
// CORE: process one HR request
// ============================================================

async function runRequestPipeline(rawEmail) {
  const agentResult = await emailIntelligenceAgent(rawEmail);

  if (agentResult.status !== "READY") {
    return { agentResult, status: agentResult.status, plan: null, finalResult: null };
  }

  const orchestrator = runOrchestrator(agentResult.normalized);
  if (orchestrator.status !== "READY_FOR_AGENT") {
    return { agentResult, status: orchestrator.status, plan: null, finalResult: null };
  }

  const plan = orchestrator.executionPlan;
  let finalResult;

  if (plan.agent === "LeaveAgent") finalResult = await runLeaveAgent(plan);
  else if (plan.agent === "PayrollAgent") finalResult = runPayrollAgent(plan);
  else if (plan.agent === "AnalyticsAgent") finalResult = runAnalyticsAgent(plan);
  else return { agentResult, status: `UNKNOWN_AGENT:${plan.agent}`, plan, finalResult: null };

  return { agentResult, status: finalResult.status, plan, finalResult };
}

// ============================================================
// MAIN INBOX LOOP
// ============================================================

async function processInbox() {
  console.log("=".repeat(50));
  console.log("Scanning Gmail inbox for unread emails...");
  console.log("=".repeat(50));

  const emails = await listUnreadMentions();

  if (emails.length === 0) {
    console.log("No unread emails found.");
    return;
  }

  console.log(`Found ${emails.length} unread email(s).\n`);

  const candidates = emails.filter(isCandidate);

  console.log(`Filtered: ${candidates.length} relevant HR request email(s).`);

  const approvalReplies = candidates.filter((m) => isApprovalReply(m));

  if (approvalReplies.length > 0) {
    console.log(`\n[APPROVAL REPLIES] Found ${approvalReplies.length} to process.`);
    await processApprovalReplies(approvalReplies);
  }

  const regularRequests = candidates.filter((m) => !isApprovalReply(m));

  console.log(`\nProcessing ${Math.min(regularRequests.length, MAX_EMAILS)} new request(s) (MAX_EMAILS = ${MAX_EMAILS}).`);

  for (const message of regularRequests.slice(0, MAX_EMAILS)) {
    console.log("\n" + "-".repeat(50));
    console.log(`Processing email from: ${message.from}`);
    console.log(`Subject: ${message.subject}`);

    const rawEmail = buildRawEmail(message);

    try {
      const { agentResult, status, plan, finalResult } = await runRequestPipeline(rawEmail);

      if (status === "NEEDS_CLARIFICATION") {
        console.log("\n[MISSING INFO] Sending clarification request...");
        await sendReply(message, replyBodyOnly(agentResult.clarificationEmail));
        console.log("✓ Clarification sent.");
        await markRead(message.id);
        continue;
      }

      if (status !== "READY" && !finalResult) {
        console.log(`\n→ Skipping, pipeline stopped: ${status}`);
        if (status === "EMPLOYEE_NOT_FOUND" || status === "UNAUTHORIZED" || status === "UNKNOWN_INTENT") {
          const deniedReply = buildReply({ status }, agentResult?.normalized?.employeeEmail);
          await sendReply(message, deniedReply);
          console.log("✓ Reply sent to", message.from);
        }
        await markRead(message.id);
        continue;
      }

      if (!finalResult && status !== "READY") {
        console.log(`\n→ Orchestrator: ${status}`);
        const deniedReply = buildReply({ status, employee: agentResult?.normalized?.employeeName ? { name: agentResult.normalized.employeeName } : null }, agentResult?.normalized?.employeeEmail);
        await sendReply(message, deniedReply);
        console.log("✓ Reply sent to", message.from);
        await markRead(message.id);
        continue;
      }

      console.log(`\n[Routed to ${plan?.agent}] Status: ${finalResult?.status}`);

      const reply = buildReply(finalResult, agentResult?.normalized?.employeeEmail);
      await sendReply(message, reply);
      console.log("✓ Reply sent to", message.from);

      if (finalResult?.status === "PENDING_APPROVAL") {
        const approvalEmail = buildApprovalRequestEmail(finalResult);

        if (approvalEmail) {
          await sendEmail(approvalEmail);
          console.log(`✓ Approval request sent to ${approvalEmail.to} for ${approvalEmail.requestNumber}`);
        }
      }

      await markRead(message.id);
    } catch (err) {
      console.error(`\n❌ Error processing email from ${message.from}:`);
      console.error(err.message);
      try {
        await sendReply(
          message,
          technicalError({ name: message.from?.split("@")[0] || "there" })
        );
        await markRead(message.id);
        console.log("Sent the fallback error notification.");
      } catch (sendErr) {
        console.error("Could not send fallback:", sendErr.message);
      }
    }
  }

  console.log("\nDone processing inbox.");
}

processInbox().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});