/**
 * Step 4 — Data normalization.
 *
 * Converts Gemini output into a homogeneous application shape: dates to
 * YYYY-MM-DD and leave types to domain codes (PL / SL / UL).
 *
 * Logic preserved from the working Colab prototype.
 */

/**
 * @typedef {import("../../validation/schemas.js").EmailExtraction} EmailExtraction
 * @typedef {import("./sender.js").Sender} Sender
 */

export function normalizeDate(date) {
  if (!date) {
    return null;
  }

  const value = date.trim().toLowerCase();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // DD/MM/YYYY
  const indianDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (indianDate) {
    const day = indianDate[1].padStart(2, "0");
    const month = indianDate[2].padStart(2, "0");
    const year = indianDate[3];

    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY
  const dashDate = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (dashDate) {
    const day = dashDate[1].padStart(2, "0");
    const month = dashDate[2].padStart(2, "0");
    const year = dashDate[3];

    return `${year}-${month}-${day}`;
  }

  return date;
}

const LEAVE_TYPE_MAP = {
  PAID_LEAVE: "PL",
  ANNUAL_LEAVE: "PL",
  EARNED_LEAVE: "PL",
  CASUAL_LEAVE: "PL",
  VACATION_LEAVE: "PL",
  SICK_LEAVE: "SL",
  MEDICAL_LEAVE: "SL",
  UNPAID_LEAVE: "UL",
  LEAVE_WITHOUT_PAY: "UL",
  LOSS_OF_PAY: "UL",
};

export function normalizeLeaveType(leaveType) {
  return LEAVE_TYPE_MAP[leaveType] || null;
}

export function normalizeExtraction(extraction, sender) {
  return {
    intent: extraction.intent,

    employeeName: extraction.employeeName || sender.name,

    employeeEmail: extraction.employeeEmail || sender.email,

    leaveType: normalizeLeaveType(extraction.leaveType),

    startDate: normalizeDate(extraction.startDate),

    endDate: normalizeDate(extraction.endDate),

    reason: extraction.reason?.trim() || null,

    payrollPeriod: extraction.payrollPeriod?.trim() || null,

    query: extraction.query?.trim() || null,
  };
}