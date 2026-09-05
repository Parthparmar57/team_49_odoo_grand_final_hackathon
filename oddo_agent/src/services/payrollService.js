/**
 * Payroll service.
 *
 * Deterministic business logic for contracts, payslips and payslip lines.
 * Stand-in for PostgreSQL via Prisma.
 *
 * IMPORTANT: actual payroll calculations live here (deterministic logic),
 * never in the LLM. The Payroll Agent only READS and EXPLAINS this data.
 */

// ============================================================
// DEMO CONTRACTS
// WIRE UP TO POSTGRESQL WHEN READY
// ============================================================

const contracts = {
  emp_001: {
    id: "ctr_001",
    employeeId: "emp_001",
    type: "PERMANENT",
    startDate: "2023-04-10",
    probabEndDate: "2023-10-10",
    currency: "INR",
    monthlyGross: 58000,
    structure: {
      BASIC: 40000,
      HRA: 18000,
      SPECIAL_ALLOWANCE: 0,
      PF_DEDUCTION: 4800,
      PT_DEDUCTION: 200,
    },
  },
  emp_002: {
    id: "ctr_002",
    employeeId: "emp_002",
    type: "PERMANENT",
    startDate: "2022-01-05",
    probabEndDate: "2022-07-05",
    currency: "INR",
    monthlyGross: 70000,
    structure: {
      BASIC: 50000,
      HRA: 20000,
      SPECIAL_ALLOWANCE: 0,
      PF_DEDUCTION: 6000,
      PT_DEDUCTION: 200,
    },
  },
  emp_003: {
    id: "ctr_003",
    employeeId: "emp_003",
    type: "PERMANENT",
    startDate: "2023-05-01",
    probabEndDate: "2023-11-01",
    currency: "INR",
    monthlyGross: 30000,
    structure: {
      BASIC: 20000,
      HRA: 10000,
      SPECIAL_ALLOWANCE: 0,
      PF_DEDUCTION: 2400,
      PT_DEDUCTION: 200,
    },
  },
  emp_006: {
    id: "ctr_006",
    employeeId: "emp_006",
    type: "PERMANENT",
    startDate: "2024-03-18",
    probabEndDate: "2024-09-18",
    currency: "INR",
    monthlyGross: 42000,
    structure: {
      BASIC: 28000,
      HRA: 14000,
      SPECIAL_ALLOWANCE: 0,
      PF_DEDUCTION: 3360,
      PT_DEDUCTION: 200,
    },
  },
  emp_009: {
    id: "ctr_009",
    employeeId: "emp_009",
    type: "PERMANENT",
    startDate: "2024-09-01",
    probabEndDate: "2025-03-01",
    currency: "INR",
    monthlyGross: 35000,
    structure: {
      BASIC: 25000,
      HRA: 10000,
      SPECIAL_ALLOWANCE: 0,
      PF_DEDUCTION: 3000,
      PT_DEDUCTION: 200,
    },
  },
};

// ============================================================
// DEMO PAYSLIPS
// WIRE UP TO POSTGRESQL WHEN READY
// ============================================================

const payslips = {
  emp_001: {
    "2026-06": {
      employeeId: "emp_001",
      month: "2026-06",
      gross: 58000,
      breakdown: {
        earnings: { basic: 40000, hra: 18000, specialAllowance: 0 },
        deductions: { pf: 4800, pt: 200, incomeTax: 0 },
      },
      net: 53000,
      status: "GENERATED",
    },
  },
  emp_002: {
    "2026-06": {
      employeeId: "emp_002",
      month: "2026-06",
      gross: 70000,
      breakdown: {
        earnings: { basic: 50000, hra: 20000, specialAllowance: 0 },
        deductions: { pf: 6000, pt: 200, incomeTax: 0 },
      },
      net: 63800,
      status: "GENERATED",
    },
  },
  emp_003: {
    "2026-06": {
      employeeId: "emp_003",
      month: "2026-06",
      gross: 30000,
      breakdown: {
        earnings: { basic: 20000, hra: 10000, specialAllowance: 0 },
        deductions: { pf: 2400, pt: 200, incomeTax: 0 },
      },
      net: 27400,
      status: "GENERATED",
    },
    "2026-08": {
      employeeId: "emp_003",
      month: "2026-08",
      gross: 30000,
      breakdown: {
        earnings: { basic: 20000, hra: 10000, specialAllowance: 0 },
        deductions: { pf: 2400, pt: 200, incomeTax: 0 },
      },
      net: 27400,
      status: "GENERATED",
    },
  },
  emp_006: {
    "2026-06": {
      employeeId: "emp_006",
      month: "2026-06",
      gross: 42000,
      breakdown: {
        earnings: { basic: 28000, hra: 14000, specialAllowance: 0 },
        deductions: { pf: 3360, pt: 200, incomeTax: 0 },
      },
      net: 38440,
      status: "GENERATED",
    },
    "2026-08": {
      employeeId: "emp_006",
      month: "2026-08",
      gross: 42000,
      breakdown: {
        earnings: { basic: 28000, hra: 14000, specialAllowance: 0 },
        deductions: { pf: 3360, pt: 200, incomeTax: 0 },
      },
      net: 38440,
      status: "GENERATED",
    },
  },
  emp_009: {
    "2026-06": {
      employeeId: "emp_009",
      month: "2026-06",
      gross: 35000,
      breakdown: {
        earnings: { basic: 25000, hra: 10000, specialAllowance: 0 },
        deductions: { pf: 3000, pt: 200, incomeTax: 0 },
      },
      net: 31800,
      status: "GENERATED",
    },
    "2026-08": {
      employeeId: "emp_009",
      month: "2026-08",
      gross: 35000,
      breakdown: {
        earnings: { basic: 25000, hra: 10000, specialAllowance: 0 },
        deductions: { pf: 3000, pt: 200, incomeTax: 0, lop: 4500 },
      },
      net: 27300,
      status: "GENERATED",
    },
  },
};

// ============================================================
// PERIOD RESOLUTION (deterministic — "June" -> "2026-06")
// ============================================================

const MONTHS = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  jan: "01", feb: "02", mar: "03", apr: "04", jun: "06", jul: "07",
  aug: "08", sep: "09", sept: "09", oct: "10", nov: "11", dec: "12",
};

function extractMonth(text) {
  const normalized = String(text || "").trim().toLowerCase();
  return MONTHS[normalized] || null;
}

/**
 * Resolve a human written period ("June", "Jun", "2026-06") to a stored
 * payslip key. Returns null when nothing matches.
 */
function resolvePeriod(employeeId, period) {
  const availableKeys = Object.keys(payslips[employeeId] || {});

  if (availableKeys.length === 0) {
    return null;
  }

  // Exact key match.
  if (period && availableKeys.includes(period)) {
    return period;
  }

  // Month name match (any available year for that month).
  const month = extractMonth(period);
  if (month && period) {
    const match = availableKeys.find((key) => key.endsWith(`-${month}`));
    if (match) {
      return match;
    }
  }

  // Latest available period.
  if (!period) {
    const sorted = [...availableKeys].sort();
    return sorted[sorted.length - 1];
  }

  return null;
}

// ============================================================
// LOOKUPS (tools used by the Payroll Agent)
// ============================================================

export function getContract(employeeId) {
  return contracts[employeeId] || null;
}

export function getPayslip(employeeId, period) {
  const resolved = resolvePeriod(employeeId, period);
  return payslips[employeeId]?.[resolved] || null;
}

export function getPayslipLines(employeeId, period) {
  const slip = getPayslip(employeeId, period);
  if (!slip) {
    return null;
  }

  return {
    month: slip.month,
    earnings: [
      { component: "Basic", amount: slip.breakdown.earnings.basic },
      { component: "HRA", amount: slip.breakdown.earnings.hra },
      { component: "Special Allowance", amount: slip.breakdown.earnings.specialAllowance },
    ],
    deductions: [
      { component: "Provident Fund (PF)", amount: slip.breakdown.deductions.pf },
      { component: "Professional Tax (PT)", amount: slip.breakdown.deductions.pt },
      { component: "Loss of Pay (LOP)", amount: slip.breakdown.deductions.lop || 0 },
      { component: "Income Tax", amount: slip.breakdown.deductions.incomeTax },
    ],
    gross: slip.gross,
    net: slip.net,
  };
}