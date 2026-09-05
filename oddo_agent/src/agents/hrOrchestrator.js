/**
 * HR Orchestrator.
 *
 * Receives a validated, normalized request from the Email Intelligence Agent,
 * identifies the employee, checks context, evaluates authorization/risk,
 * selects the correct specialized agent and produces an execution plan.
 *
 * The Orchestrator NEVER performs database operations itself.
 *
 * Logic preserved from the working Colab prototype (converted to ES modules).
 */
import { z } from "zod";
import { authorize, getRoleForEmail, MODULES, ACTION } from "../services/iamService.js";

// ============================================================
// INPUT FROM EMAIL INTELLIGENCE AGENT
// ============================================================

const emailIntelligenceOutput = {
  intent: "LEAVE_REQUEST",
  employeeName: "Rahul Sharma",
  employeeEmail: "rahul@technova.com",
  leaveType: "PL",
  startDate: "September 15",
  endDate: "September 16",
  reason: "attend a family function outside Ahmedabad",
  payrollPeriod: null,
  query: null,
};

// ============================================================
// DEMO EMPLOYEE DATA
// Later this will come from PostgreSQL
// ============================================================

const employees = [
  {
    id: "emp_001",
    employeeNumber: "EMP001",
    name: "Rahul Sharma",
    email: "rahul@technova.com",
    status: "ACTIVE",
  },
  {
    id: "emp_002",
    employeeNumber: "EMP002",
    name: "Priya Patel",
    email: "priya@technova.com",
    status: "ACTIVE",
  },
  {
    id: "emp_003",
    employeeNumber: "EMP003",
    name: "Vinay",
    email: "vinayvajabs2276@gmail.com",
    status: "ACTIVE",
  },
  {
    id: "emp_006",
    employeeNumber: "EMP006",
    name: "Vicky Patel",
    email: "vicky3213@gmail.com",
    status: "ACTIVE",
  },
  {
    id: "emp_007",
    employeeNumber: "EMP007",
    name: "Vinay Payroll",
    email: "vinayvaja2276@gmail.com",
    status: "ACTIVE",
  },
  {
    id: "emp_008",
    employeeNumber: "EMP008",
    name: "Parth Parmar",
    email: "parthparmar5172@gmail.com",
    status: "ACTIVE",
  },
  {
    id: "emp_009",
    employeeNumber: "EMP009",
    name: "Harsh Patel",
    email: "harshjpatel200666@gmail.com",
    status: "ACTIVE",
  },
];

// ============================================================
// DEMO LEAVE CONTEXT
// Later this will come from PostgreSQL
// ============================================================

const leaveContext = {
  employeeId: "emp_001",
  leaveType: "PL",
  allocated: 18,
  used: 6,
  remaining: 12,
};

// ============================================================
// ZOD SCHEMA
// Validates the output coming from Email Intelligence Agent
// ============================================================

const OrchestratorInputSchema = z.object({
  intent: z.string(),
  employeeName: z.string().nullable(),
  employeeEmail: z.string(),
  leaveType: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  reason: z.string().nullable(),
  payrollPeriod: z.string().nullable(),
  query: z.string().nullable(),
});

// ============================================================
// STEP 1
// RECEIVE REQUEST
// ============================================================

function receiveRequest(input) {
  console.log("\n[STEP 1] Receive Request");

  const result = OrchestratorInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      status: "INVALID_INPUT",
      errors: result.error.issues,
    };
  }

  console.log("✓ Structured request received");
  console.log("Intent:", input.intent);

  return {
    success: true,
    data: result.data,
  };
}

// ============================================================
// STEP 2
// UNDERSTAND INTENT
// ============================================================

function understandIntent(state) {
  console.log("\n[STEP 2] Understand Intent");

  const allowedIntents = [
    "LEAVE_REQUEST",
    "PAYROLL_QUERY",
    "ATTENDANCE_QUERY",
    "POLICY_QUERY",
    "ANALYTICS_QUERY",
    "GENERAL_HR_QUERY",
  ];

  if (!allowedIntents.includes(state.intent)) {
    console.log("✗ Unknown intent");

    return {
      ...state,
      status: "UNKNOWN_INTENT",
    };
  }

  console.log("✓ Intent:", state.intent);

  return {
    ...state,
    status: "INTENT_IDENTIFIED",
  };
}

// ============================================================
// STEP 3
// IDENTIFY EMPLOYEE
// ============================================================

function identifyEmployee(state) {
  console.log("\n[STEP 3] Identify Employee");

  // Clean Markdown email returned by an LLM
  const cleanEmail = state.employeeEmail
    .replace(/\[([^\]]+)\]\(mailto:[^)]+\)/i, "$1")
    .trim()
    .toLowerCase();

  const employee = employees.find((emp) => emp.email.toLowerCase() === cleanEmail);

  if (!employee) {
    console.log("✗ Employee not found:", cleanEmail);

    return {
      ...state,
      status: "EMPLOYEE_NOT_FOUND",
    };
  }

  const userRole = getRoleForEmail(employee.email);

  console.log("✓ Employee identified");
  console.log("  ID:", employee.id);
  console.log("  Name:", employee.name);
  console.log("  Email:", employee.email);
  console.log("  IAM Role:", userRole);

  return {
    ...state,
    employeeName: employee.name,
    employeeEmail: employee.email,
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeStatus: employee.status,
    userRole,
    status: "EMPLOYEE_IDENTIFIED",
  };
}

// ============================================================
// STEP 4
// CHECK CONTEXT
// ============================================================

function checkContext(state) {
  console.log("\n[STEP 4] Check Context");

  const missingFields = [];

  // Required information for leave request
  if (state.intent === "LEAVE_REQUEST") {
    if (!state.leaveType) {
      missingFields.push("leaveType");
    }

    if (!state.startDate) {
      missingFields.push("startDate");
    }

    if (!state.endDate) {
      missingFields.push("endDate");
    }

    if (!state.reason) {
      missingFields.push("reason");
    }
  }

  if (missingFields.length > 0) {
    console.log("✗ Missing information:", missingFields);

    return {
      ...state,
      missingFields,
      status: "NEEDS_CLARIFICATION",
    };
  }

  console.log("✓ Required information is available");

  // Demo DB context
  if (state.intent === "LEAVE_REQUEST") {
    console.log("  Leave Type:", state.leaveType);
    console.log("  Start:", state.startDate);
    console.log("  End:", state.endDate);
    console.log("  Reason:", state.reason);

    console.log("  Available Leave:", leaveContext.remaining, "days");
  }

  return {
    ...state,
    context: {
      leaveBalance: leaveContext.remaining,
    },
    status: "CONTEXT_CHECKED",
  };
}

// ============================================================
// STEP 5
// CHECK AUTHORIZATION & RISK
// ============================================================

function checkAuthorizationAndRisk(state) {
  console.log("\n[STEP 5] Check Authorization & Risk");

  let requiresHumanApproval = false;
  let operationType = "READ";
  let module;
  let action;

  switch (state.intent) {
    case "LEAVE_REQUEST":
      operationType = "CREATE_LEAVE_REQUEST";
      module = MODULES.TIME_OFF;
      action = ACTION.CREATE;
      requiresHumanApproval = true;
      break;

    case "PAYROLL_QUERY":
      operationType = "READ_PAYROLL";
      module = MODULES.PAYRUNS;
      action = ACTION.READ;
      requiresHumanApproval = false;
      break;

    case "ATTENDANCE_QUERY":
      operationType = "READ_ATTENDANCE";
      module = MODULES.ATTENDANCE;
      action = ACTION.READ;
      requiresHumanApproval = false;
      break;

    case "POLICY_QUERY":
      operationType = "READ_POLICY";
      module = MODULES.POLICIES;
      action = ACTION.READ;
      requiresHumanApproval = false;
      break;

    case "ANALYTICS_QUERY":
      operationType = "READ_ANALYTICS";
      module = MODULES.ANALYTICS;
      action = ACTION.READ;
      requiresHumanApproval = false;
      break;

    default:
      operationType = "UNKNOWN";
      requiresHumanApproval = true;
  }

  console.log("✓ Operation:", operationType);

  // IAM check: does the caller's role permit this operation?
  const authz = authorize({
    email: state.employeeEmail,
    role: state.userRole,
    action,
    module,
  });

  console.log("✓ Caller role:", authz.role);
  console.log("✓ Permission:", `${authz.action}::${authz.module}`, "→", authz.allowed ? "ALLOWED" : "DENIED");

  if (!authz.allowed) {
    console.log("✗ Access denied:", authz.reason);

    return {
      ...state,
      status: "UNAUTHORIZED",
      authorization: authz,
    };
  }

  console.log("✓ Human approval required:", requiresHumanApproval);

  return {
    ...state,
    operationType,
    requiresHumanApproval,
    authorization: authz,
    status: "AUTHORIZATION_CHECKED",
  };
}

// ============================================================
// STEP 6
// SELECT SPECIALIZED AGENT
// ============================================================

function selectAgent(state) {
  console.log("\n[STEP 6] Select Specialized Agent");

  let selectedAgent;

  switch (state.intent) {
    case "LEAVE_REQUEST":
      selectedAgent = "LeaveAgent";
      break;

    case "PAYROLL_QUERY":
      selectedAgent = "PayrollAgent";
      break;

    case "ATTENDANCE_QUERY":
      selectedAgent = "AttendanceAgent";
      break;

    case "POLICY_QUERY":
      selectedAgent = "PolicyAgent";
      break;

    case "ANALYTICS_QUERY":
      selectedAgent = "AnalyticsAgent";
      break;

    default:
      selectedAgent = "ClarificationNode";
  }

  console.log("✓ Selected:", selectedAgent);

  return {
    ...state,
    selectedAgent,
    status: "AGENT_SELECTED",
  };
}

// ============================================================
// STEP 7
// CREATE EXECUTION PLAN
// ============================================================

function createExecutionPlan(state) {
  console.log("\n[STEP 7] Create Execution Plan");

  let allowedTools = [];
  let requiredChecks = [];

  if (state.selectedAgent === "LeaveAgent") {
    requiredChecks = [
      "employee_exists",
      "leave_balance",
      "existing_leave_requests",
      "working_schedule",
      "leave_policy",
    ];

    allowedTools = [
      "getEmployee",
      "getLeaveBalance",
      "getExistingLeaveRequests",
      "getWorkingSchedule",
      "searchLeavePolicy",
      "createLeaveRequest",
    ];
  }

  if (state.selectedAgent === "PayrollAgent") {
    requiredChecks = ["employee_exists", "payroll_period", "contract", "payslip"];

    allowedTools = ["getEmployee", "getContract", "getPayslip", "getPayslipLines"];
  }

  if (state.selectedAgent === "AnalyticsAgent") {
    requiredChecks = ["authorization", "analytics_scope"];

    allowedTools = ["getPayrollMetrics", "getAttendanceMetrics", "getLeaveMetrics"];
  }

  const executionPlan = {
    requestId: `req_${Date.now()}`,

    agent: state.selectedAgent,

    operation: state.operationType,

    employee: {
      id: state.employeeId,
      employeeNumber: state.employeeNumber,
      name: state.employeeName,
      email: state.employeeEmail,
    },

    input: {
      intent: state.intent,
      leaveType: state.leaveType,
      startDate: state.startDate,
      endDate: state.endDate,
      reason: state.reason,
      payrollPeriod: state.payrollPeriod,
      query: state.query,
    },

    requiredChecks,

    allowedTools,

    requiresHumanApproval: state.requiresHumanApproval,

    status: "READY_FOR_AGENT",
  };

  console.log("✓ Execution plan created");

  return {
    ...state,
    executionPlan,
    status: "READY_FOR_AGENT",
  };
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

export function runOrchestrator(input) {
  console.log("==============================================");
  console.log("        PEOPLEPAY360 HR ORCHESTRATOR");
  console.log("==============================================");

  // STEP 1
  const received = receiveRequest(input);

  if (!received.success) {
    return received;
  }

  let state = received.data;

  // STEP 2
  state = understandIntent(state);

  if (state.status === "UNKNOWN_INTENT") {
    return state;
  }

  // STEP 3
  state = identifyEmployee(state);

  if (state.status === "EMPLOYEE_NOT_FOUND") {
    return state;
  }

  // STEP 4
  state = checkContext(state);

  if (state.status === "NEEDS_CLARIFICATION") {
    return state;
  }

  // STEP 5
  state = checkAuthorizationAndRisk(state);

  if (state.status === "UNAUTHORIZED") {
    return state;
  }

  // STEP 6
  state = selectAgent(state);

  // STEP 7
  state = createExecutionPlan(state);

  return state;
}

// ============================================================
// RUN TEST
// ============================================================

export function runOrchestratorTest() {
  const finalState = runOrchestrator(emailIntelligenceOutput);

  // ============================================================
  // FINAL OUTPUT
  // ============================================================

  console.log("\n==============================================");
  console.log("             ORCHESTRATOR RESULT");
  console.log("==============================================");

  console.log(JSON.stringify(finalState, null, 2));

  return finalState;
}

export { emailIntelligenceOutput, employees, leaveContext };