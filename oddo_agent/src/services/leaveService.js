/**
 * Leave service.
 *
 * Deterministic business logic for leave allocations, balances, overlap
 * checks, working-day counting and leave request creation.
 *
 * Stand-in for PostgreSQL via Prisma — data lives in memory today but the
 * function signatures mirror the eventual database-backed service.
 *
 * IMPORTANT: All calculations here are deterministic application logic.
 * No LLM is involved in computing balances or days.
 */
import { getEmployee } from "./employeeService.js";
import { isWorkingDay } from "./workingScheduleService.js";

// ============================================================
// DEMO LEAVE TYPES
// WIRE UP TO POSTGRESQL WHEN READY
// ============================================================

const leaveTypes = [
  { code: "PL", name: "Paid Leave", defaultAllocation: 18 },
  { code: "SL", name: "Sick Leave", defaultAllocation: 12 },
  { code: "UL", name: "Unpaid Leave", defaultAllocation: 0 },
];

// Demo allocations: employeeId -> leaveType -> { allocated, used }
const leaveAllocations = {
  emp_001: {
    PL: { allocated: 18, used: 6 },
    SL: { allocated: 12, used: 0 },
    UL: { allocated: 0, used: 0 },
  },
  emp_002: {
    PL: { allocated: 18, used: 2 },
    SL: { allocated: 12, used: 1 },
    UL: { allocated: 0, used: 0 },
  },
  emp_003: {
    PL: { allocated: 18, used: 0 },
    SL: { allocated: 12, used: 0 },
    UL: { allocated: 0, used: 0 },
  },
  emp_006: {
    PL: { allocated: 18, used: 2 },
    SL: { allocated: 12, used: 1 },
    UL: { allocated: 0, used: 0 },
  },
};

// Created leave requests. All start as PENDING_APPROVAL.
const leaveRequests = [];

let requestSequence = 0;

// ============================================================
// DATE PARSING (deterministic, explicit rules)
// ============================================================

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const MONTHS_SHORT = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse a supported date string into a Date object. Returns null when the
 * string cannot be interpreted. Mirrors the email agent's normalizeDate
 * formats plus natural language month names (e.g. "September 15").
 */
export function parseDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  const yearNow = new Date().getFullYear();

  // YYYY-MM-DD
  let m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  // DD/MM/YYYY or DD-MM-YYYY
  m = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  // "Month DD" -> e.g. "September 15"
  m = text.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (m) {
    const month = MONTHS_SHORT[m[1].toLowerCase().slice(0, 3)];
    const day = Number(m[2]);
    if (month !== undefined) {
      return new Date(yearNow, month, day);
    }
  }

  // "DD Month" -> e.g. "15 September"
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)$/);
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS_SHORT[m[2].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      return new Date(yearNow, month, day);
    }
  }

  // Weekday name -> next upcoming occurrence, e.g. "Monday" / "Tuesday"
  const WEEKDAYS = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };

  m = text.match(/^([A-Za-z]+)$/);
  if (m) {
    const targetDay = WEEKDAYS[m[1].toLowerCase()];
    if (targetDay !== undefined) {
      const today = new Date();
      const currentDay = today.getDay();
      let ahead = (targetDay - currentDay + 7) % 7;
      if (ahead === 0) {
        ahead = 7;
      }
      const resolved = new Date(today);
      resolved.setDate(today.getDate() + ahead);
      return resolved;
    }
  }

  return null;
}

function toISODate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ============================================================
// BALANCE (tools used by agents)
// ============================================================

export function getLeaveBalance(employeeId, leaveType) {
  const allocation = leaveAllocations[employeeId]?.[leaveType];

  if (!allocation) {
    return {
      employeeId,
      leaveType,
      allocated: 0,
      used: 0,
      remaining: 0,
      found: false,
    };
  }

  // Reduce balance by requests already created but still pending, so the
  // number shown is the immediately usable balance.
  const pendingDays = leaveRequests
    .filter((req) => req.employeeId === employeeId && req.leaveType === leaveType && req.status === "PENDING_APPROVAL")
    .reduce((sum, req) => sum + req.days, 0);

  const remaining = allocation.allocated - allocation.used - pendingDays;

  return {
    employeeId,
    leaveType,
    allocated: allocation.allocated,
    used: allocation.used,
    pending: pendingDays,
    remaining: Math.max(0, remaining),
    found: true,
  };
}

// ============================================================
// EXISTING REQUESTS & OVERLAP (tools used by agents)
// ============================================================

export function getExistingLeaveRequests(employeeId) {
  return leaveRequests.filter((req) => req.employeeId === employeeId);
}

export function findOverlappingRequests(employeeId, startDate, endDate) {
  const start = toISODate(startDate);
  const end = toISODate(endDate);

  return leaveRequests.filter(
    (req) =>
      req.employeeId === employeeId &&
      req.status !== "CANCELLED" &&
      req.startDate <= end &&
      req.endDate >= start
  );
}

// ============================================================
// WORKING-DAY COUNT (deterministic)
// ============================================================

export function countLeaveDays(employeeId, startDate, endDate) {
  let days = 0;
  const counted = [];

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  const last = new Date(endDate);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    if (isWorkingDay(employeeId, cursor)) {
      days += 1;
      counted.push(toISODate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { days, workingDates: counted };
}

// ============================================================
// CREATE REQUEST (deterministic; always PENDING_APPROVAL)
// ============================================================

export function createLeaveRequest({ employeeId, leaveType, startDate, endDate, reason }) {
  const employee = getEmployee(employeeId);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const start = toISODate(startDate);
  const end = toISODate(endDate);

  const { days, workingDates } = countLeaveDays(employeeId, startDate, endDate);

  requestSequence += 1;

  const request = {
    id: `leave_${Date.now()}_${requestSequence}`,
    requestNumber: `LVR-${new Date().getFullYear()}-${String(requestSequence).padStart(4, "0")}`,
    employeeId,
    employeeName: employee.name,
    leaveType,
    startDate: start,
    endDate: end,
    days,
    workingDates,
    reason,
    status: "PENDING_APPROVAL",
    createdAt: new Date().toISOString(),
    approvedById: null,
    approvedAt: null,
    rejectionReason: null,
  };

  leaveRequests.push(request);

  return request;
}

// ============================================================
// APPROVAL (human authority — HR acts, not the agent)
// ============================================================

export function listLeaveRequests(status) {
  if (!status) {
    return leaveRequests;
  }
  return leaveRequests.filter((req) => req.status === status);
}

export function approveLeaveRequest(requestId, approvedBy) {
  const request = leaveRequests.find((req) => req.id === requestId);

  if (!request) {
    return null;
  }

  if (request.status !== "PENDING_APPROVAL") {
    return request;
  }

  request.status = "APPROVED";
  request.approvedById = approvedBy || "hr_approver";
  request.approvedAt = new Date().toISOString();

  return request;
}

export function rejectLeaveRequest(requestId, reason, rejectedBy) {
  const request = leaveRequests.find((req) => req.id === requestId);

  if (!request) {
    return null;
  }

  if (request.status !== "PENDING_APPROVAL") {
    return request;
  }

  request.status = "REJECTED";
  request.approvedById = rejectedBy || "hr_approver";
  request.approvedAt = new Date().toISOString();
  request.rejectionReason = reason || "Not specified";

  return request;
}