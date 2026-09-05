/**
 * Working Schedule service.
 *
 * Determines whether a given date is a working day for an employee.
 *
 * Deterministic application logic. Stand-in for PostgreSQL via Prisma.
 * JS getDay(): 0 = Sunday, 1 = Monday ... 6 = Saturday.
 */

// ============================================================
// DEMO SCHEDULE DATA
// WIRE UP TO POSTGRESQL WHEN READY
// ============================================================

// Company default: Monday-Saturday working, Sunday off.
// (India payroll conventions commonly count half-day Saturday; here
// Saturday counts as a working day.)

const DEFAULT_SCHEDULE = {
  0: "OFF", // Sunday
  1: "WORK", // Monday
  2: "WORK", // Tuesday
  3: "WORK", // Wednesday
  4: "WORK", // Thursday
  5: "WORK", // Friday
  6: "WORK", // Saturday
};

// Per-employee overrides. Empty means "use company default".
const employeeOverrides = {
  // emp_002: { 6: "OFF" },
};

// Company holiday calendar (YYYY-MM-DD). Populate from DB later.
const companyHolidays = new Set([
  // "2026-08-15", // Independence Day
  // "2026-10-02", // Gandhi Jayanti
]);

// ============================================================
// DETERMINISTIC LOGIC
// ============================================================

export function getWorkingSchedule(employeeId) {
  const override = employeeOverrides[employeeId] || {};

  const schedule = {};
  for (let day = 0; day <= 6; day += 1) {
    schedule[day] = override[day] || DEFAULT_SCHEDULE[day];
  }

  return schedule;
}

export function isWorkingDay(employeeId, date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;

  if (companyHolidays.has(iso)) {
    return false;
  }

  const schedule = getWorkingSchedule(employeeId);
  return schedule[date.getDay()] === "WORK";
}

export function listCompanyHolidays() {
  return [...companyHolidays];
}