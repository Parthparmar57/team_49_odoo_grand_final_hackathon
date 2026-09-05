/**
 * PeoplePay360 — Email → Intent → Specialized Agent → HR Approval pipeline.
 *
 * Flow:
 *   1. Email Intelligence Agent identifies the INTENT in the email.
 *   2. HR Orchestrator routes the intent to ONE of three specialized agents:
 *        - LEAVE_REQUEST    -> LeaveAgent
 *        - PAYROLL_QUERY    -> PayrollAgent
 *        - ANALYTICS_QUERY  -> AnalyticsAgent
 *   3. The agent checks deterministic business data and drafts a message
 *      for HR.
 *   4. Human Approval reviews and approves.
 *
 * Pick the sample with:  EMAIL_SAMPLE=leave|payroll|analytics
 */
import "dotenv/config";
import { emailIntelligenceAgent } from "./agents/emailAgent.js";
import { runOrchestrator } from "./agents/hrOrchestrator.js";
import { runLeaveAgent } from "./agents/leaveAgent.js";
import { runPayrollAgent } from "./agents/payrollAgent.js";
import { runAnalyticsAgent } from "./agents/analyticsAgent.js";
import { reviewForApproval } from "./agents/humanApproval.js";
import { getSampleEmail } from "./data/samples.js";

const SAMPLE_KEY = process.env.EMAIL_SAMPLE || "leave.normal";
const SAMPLE_EMAIL = getSampleEmail(SAMPLE_KEY);

async function main() {
  console.log("==============================================");
  console.log("          PEOPLEPAY360 EMAIL PIPELINE");
  console.log("  sample:", SAMPLE_KEY);
  console.log("==============================================");

  // ----------------------------------------------------------
  // 1. EMAIL INTELLIGENCE AGENT — identify the intent
  // ----------------------------------------------------------
  const agentResult = await emailIntelligenceAgent(SAMPLE_EMAIL);

  if (agentResult.status === "NEEDS_CLARIFICATION") {
    console.log("\n[CLARIFICATION EMAIL]");
    console.log(agentResult.clarificationEmail);
    return;
  }

  if (agentResult.status !== "READY") {
    console.log("\n→ Pipeline stopped: status", agentResult.status);
    return;
  }

  console.log("\n>>> INTENT IDENTIFIED:", agentResult.extraction.intent);

  // ----------------------------------------------------------
  // 2. HR ORCHESTRATOR — route to specialized agent
  // ----------------------------------------------------------
  const orchestratorResult = runOrchestrator(agentResult.normalized);

  if (orchestratorResult.status !== "READY_FOR_AGENT") {
    console.log("\n→ Pipeline stopped: orchestrator status", orchestratorResult.status);
    return;
  }

  const executionPlan = orchestratorResult.executionPlan;

  // ----------------------------------------------------------
  // 3. ROUTE TO ONE OF THE THREE AGENTS
  // ----------------------------------------------------------
  let agentName;
  let agentResultFinal;

  if (executionPlan.agent === "LeaveAgent") {
    agentName = "LeaveAgent";
    agentResultFinal = await runLeaveAgent(executionPlan);
  } else if (executionPlan.agent === "PayrollAgent") {
    agentName = "PayrollAgent";
    agentResultFinal = runPayrollAgent(executionPlan);
  } else if (executionPlan.agent === "AnalyticsAgent") {
    agentName = "AnalyticsAgent";
    agentResultFinal = runAnalyticsAgent(executionPlan);
  } else {
    console.log("\n→ Route:", executionPlan.agent, "(not one of the three supported agents)");
    return;
  }

  console.log("\n==============================================");
  console.log("          ROUTED AGENT: ", agentName);
  console.log("==============================================");
  console.log("Intent:", agentResult.extraction.intent, "→", agentName);
  console.log("Status:", agentResultFinal.status);
  console.log("\n[HR MESSAGE FROM AGENT]");
  console.log(agentResultFinal.message || "(agent produced no message)");
  console.log(JSON.stringify(agentResultFinal, null, 2));

  // ----------------------------------------------------------
  // 4. HUMAN APPROVAL — authority for sensitive actions
  // ----------------------------------------------------------
  if (agentResultFinal.status === "PENDING_APPROVAL" || agentResultFinal.requiresHumanApproval !== false) {
    const approval = reviewForApproval(agentResultFinal, {
      approver: "HR Manager",
      approverEmail: "vinayvajabs2276@gmail.com",
      decision: "APPROVED",
    });

    console.log("\n[APPROVAL RESULT]");
    console.log(JSON.stringify(approval, null, 2));
  } else {
    console.log("\n→ No human approval required for this action.");
  }
}

main().catch((error) => {
  console.error("\n❌ Pipeline failed:");
  console.error(error);
  process.exitCode = 1;
});