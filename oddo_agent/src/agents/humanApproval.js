/**
 * Human Approval — the authority for sensitive actions.
 *
 * Agents draft messages; HR reviews and approves. This step exists to make
 * the boundary explicit: no agent can approve or finalize a sensitive action
 * on its own. Only roles with APPROVE access on the Time Off module may
 * approve or reject Time Off requests.
 */
import { approveLeaveRequest, rejectLeaveRequest } from "../services/leaveService.js";
import { authorize, MODULES, ACTION } from "../services/iamService.js";

export function reviewForApproval(agentResult, { approver = "HR Manager", decision = "APPROVED", rejectReason = null, approverEmail = null } = {}) {
  console.log("\n========================================");
  console.log("HUMAN APPROVAL");
  console.log("========================================");

  console.log("Reviewer:", approver);
  console.log("Request:", agentResult.requestId);
  console.log("Agent status:", agentResult.status);
  console.log("Message being reviewed:");
  console.log("  " + (agentResult.message || "(no message)"));

  // IAM check: only an authorized approver may approve/reject Time Off.
  const authz = authorize({
    email: approverEmail,
    action: ACTION.APPROVE,
    module: MODULES.TIME_OFF,
  });

  if (agentResult.status === "PENDING_APPROVAL" && agentResult.leaveRequest) {
    if (!authz.allowed) {
      console.log("✗ Access denied:", authz.reason);

      return {
        requestId: agentResult.requestId,
        worker: agentResult.employee
          ? `${agentResult.employee.name} (${agentResult.employee.email})`
          : null,
        agentStatus: agentResult.status,
        decision: "DENIED",
        approver,
        approvedAt: new Date().toISOString(),
        requiresHumanApproval: agentResult.requiresHumanApproval ?? false,
        authorization: authz,
        rejected: true,
        rejectionReason: authz.reason,
        nextStep: "notify_requester_and_audit_log",
      };
    }

    if (decision === "APPROVED") {
      const updated = approveLeaveRequest(agentResult.leaveRequest.id, approver);

      if (updated) {
        agentResult.approvedLeaveRequest = updated;
      }
      console.log(`✓ Leave request ${agentResult.leaveRequest.id} APPROVED by ${approver}`);
    } else {
      const updated = rejectLeaveRequest(agentResult.leaveRequest.id, rejectReason, approver);

      if (updated) {
        agentResult.approvedLeaveRequest = updated;
      }
      console.log(`✗ Leave request ${agentResult.leaveRequest.id} REJECTED by ${approver}`);
    }
  } else {
    // Read-only drafts (payroll / analytics): HR authorizes sending.
    console.log(`✓ Response draft authorized for dispatch by ${approver}`);
  }

  return {
    requestId: agentResult.requestId,
    worker: agentResult.employee
      ? `${agentResult.employee.name} (${agentResult.employee.email})`
      : null,
    agentStatus: agentResult.status,
    decision,
    approver,
    approvedAt: new Date().toISOString(),
    requiresHumanApproval: agentResult.requiresHumanApproval ?? false,
    authorization: authz,
    nextStep: "notify_employee_and_audit_log",
  };
}