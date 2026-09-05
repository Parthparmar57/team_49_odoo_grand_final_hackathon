/**
 * Employee service.
 *
 * Deterministic business logic for looking up employees. Stand-in for
 * PostgreSQL via Prisma — the data lives in memory today but the function
 * signatures mirror the eventual database-backed service.
 */

// ============================================================
// DEMO EMPLOYEE DATA
// WIRE UP TO POSTGRESQL WHEN READY
// ============================================================

const employees = [
  {
    id: "emp_001",
    employeeNumber: "EMP001",
    name: "Rahul Sharma",
    email: "rahul@technova.com",
    departmentId: "dept_001",
    status: "ACTIVE",
    role: "employee",
    dateOfJoining: "2023-04-10",
  },
  {
    id: "emp_002",
    employeeNumber: "EMP002",
    name: "Priya Patel",
    email: "priya@technova.com",
    departmentId: "dept_002",
    status: "ACTIVE",
    role: "employee",
    dateOfJoining: "2022-01-05",
  },
  {
    id: "emp_003",
    employeeNumber: "EMP003",
    name: "Vinay",
    email: "vinayvajabs2276@gmail.com",
    departmentId: "dept_001",
    status: "ACTIVE",
    role: "hrManager",
    dateOfJoining: "2023-05-01",
  },
  {
    id: "emp_006",
    employeeNumber: "EMP006",
    name: "Vicky Patel",
    email: "vicky3213@gmail.com",
    departmentId: "dept_002",
    status: "ACTIVE",
    role: "employee",
    dateOfJoining: "2024-03-18",
  },
  {
    id: "emp_007",
    employeeNumber: "EMP007",
    name: "Vinay Payroll",
    email: "vinayvaja2276@gmail.com",
    departmentId: "dept_002",
    status: "ACTIVE",
    role: "hrPayrollUser",
    dateOfJoining: "2024-03-18",
  },
  {
    id: "emp_008",
    employeeNumber: "EMP008",
    name: "Parth Parmar",
    email: "parthparmar5172@gmail.com",
    departmentId: "dept_001",
    status: "ACTIVE",
    role: "hrPayrollManager",
    dateOfJoining: "2024-01-10",
  },
  {
    id: "emp_009",
    employeeNumber: "EMP009",
    name: "Harsh Patel",
    email: "harshjpatel200666@gmail.com",
    departmentId: "dept_002",
    status: "ACTIVE",
    role: "employee",
    dateOfJoining: "2024-09-01",
  },
];

// ============================================================
// LOOKUPS (tools used by agents)
// ============================================================

export function getEmployee(id) {
  return employees.find((emp) => emp.id === id) || null;
}

export function findEmployeeByEmail(email) {
  if (!email) {
    return null;
  }
  const clean = email.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/i, "$1").trim().toLowerCase();
  return employees.find((emp) => emp.email.toLowerCase() === clean) || null;
}

export function getAllEmployees() {
  return employees;
}