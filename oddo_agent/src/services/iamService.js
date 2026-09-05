/**
 * IAM Service — role-based access control for PeoplePay360.
 *
 * The three operational roles map 1:1 to the Google Cloud IAM custom roles
 * defined under /gcp/iam. Google Cloud IAM gates access to the underlying GCP
 * resources (Cloud Run, Firestore, Secret Manager); the permission matrix in
 * this module gates access to the HR & Payroll application modules.
 *
 * Role IDs match the custom role names created by gcp/iam/setup.*
 *   hrManager        - Full CRUD on Employees, Attendance, Contracts,
 *                      Working Schedules, Time Off. Approve/refuse Time Off.
 *                      No payroll access.
 *   hrPayrollUser    - All HR Manager perms + Create/Read/Update on Payruns
 *                      and Payslips. Read-only on Salary Structures/Rules.
 *   hrPayrollManager - All HR Payroll User perms + full CRUD on Payruns,
 *                      Payslips, Salary Structures and Salary Rules.
 *
 * Regular employees resolve to the "employee" role and can manage their own
 * leave and read their own records.
 */

// ============================================================
// ROLE MEMBERSHIP
// Mirrors the IAM bindings applied by gcp/iam/setup.*
// ============================================================

const roleBindings = {
  hrManager: ["vinayvajabs2276@gmail.com"],
  hrPayrollUser: ["vinayvaja2276@gmail.com"],
  hrPayrollManager: ["parthparmar5172@gmail.com"],
};

// ============================================================
// MODULES
// ============================================================

const MODULES = {
  EMPLOYEES: "employees",
  ATTENDANCE: "attendance",
  CONTRACTS: "contracts",
  WORKING_SCHEDULES: "workingSchedules",
  TIME_OFF: "timeOff",
  POLICIES: "policies",
  PAYRUNS: "payruns",
  PAYSLIPS: "payslips",
  SALARY_STRUCTURES: "salaryStructures",
  SALARY_RULES: "salaryRules",
  ANALYTICS: "analytics",
};

// ============================================================
// ACTIONS
// ============================================================

const ACTION = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  APPROVE: "approve",
};

// ============================================================
// PERMISSION MATRIX
// role -> module -> [actions]
// ============================================================

/**
 * Regular employees can manage their own leave and read their own
 * employment records. Payroll reads are SELF-SERVICE only — the payroll
 * agent never returns another employee's data (scoped to the caller in
 * payrollAgent). HR Manager has no payroll access by design.
 */
const employeePermissions = {
  [MODULES.EMPLOYEES]: [ACTION.READ],
  [MODULES.ATTENDANCE]: [ACTION.READ],
  [MODULES.TIME_OFF]: [ACTION.CREATE, ACTION.READ],
  [MODULES.WORKING_SCHEDULES]: [ACTION.READ],
  [MODULES.POLICIES]: [ACTION.READ],
  [MODULES.PAYRUNS]: [ACTION.READ],
  [MODULES.PAYSLIPS]: [ACTION.READ],
};

const hrManagerPermissions = {
  [MODULES.EMPLOYEES]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.ATTENDANCE]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.CONTRACTS]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.WORKING_SCHEDULES]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.TIME_OFF]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE, ACTION.APPROVE],
  [MODULES.POLICIES]: [ACTION.READ],
  [MODULES.ANALYTICS]: [ACTION.READ],
};

const hrPayrollUserPermissions = {
  ...hrManagerPermissions,
  [MODULES.PAYRUNS]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE],
  [MODULES.PAYSLIPS]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE],
  [MODULES.SALARY_STRUCTURES]: [ACTION.READ],
  [MODULES.SALARY_RULES]: [ACTION.READ],
};

const hrPayrollManagerPermissions = {
  ...hrPayrollUserPermissions,
  [MODULES.PAYRUNS]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.PAYSLIPS]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.SALARY_STRUCTURES]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
  [MODULES.SALARY_RULES]: [ACTION.CREATE, ACTION.READ, ACTION.UPDATE, ACTION.DELETE],
};

const rolePermissionMap = {
  employee: employeePermissions,
  hrManager: hrManagerPermissions,
  hrPayrollUser: hrPayrollUserPermissions,
  hrPayrollManager: hrPayrollManagerPermissions,
};

// ============================================================
// LOOKUPS
// ============================================================

/**
 * Resolve the role assigned to an email address.
 * Unknown addresses fall back to the employee (least-privilege) role.
 */
export function getRoleForEmail(email) {
  if (!email) {
    return null;
  }

  const clean = email
    .replace(/\[([^\]]+)\]\(mailto:[^)]+\)/i, "$1")
    .trim()
    .toLowerCase();

  for (const [role, emails] of Object.entries(roleBindings)) {
    if (emails.some((e) => e.toLowerCase() === clean)) {
      return role;
    }
  }

  return "employee";
}

/** Check whether a role has a given action on a given module. */
export function hasPermission(role, action, module) {
  const perms = rolePermissionMap[role];

  if (!perms) {
    return false;
  }

  const actions = perms[module];

  if (!actions) {
    return false;
  }

  return actions.includes(action);
}

/**
 * Authorize a single operation.
 * Returns { allowed, role, action, module, reason }.
 */
export function authorize({ email, role, action, module }) {
  const resolvedRole = role || getRoleForEmail(email);
  const allowed = hasPermission(resolvedRole, action, module);

  return {
    allowed,
    role: resolvedRole,
    action,
    module,
    reason: allowed
      ? "PERMITTED"
      : `ROLE '${resolvedRole}' lacks '${action}' access to '${module}'`,
  };
}

/**
 * List every module a role can act on, with its actions.
 * Useful for debugging authorization config.
 */
export function describeRole(role) {
  const perms = rolePermissionMap[role];

  if (!perms) {
    return null;
  }

  return Object.entries(perms).map(([module, actions]) => ({ module, actions }));
}

export { MODULES, ACTION, roleBindings, rolePermissionMap };