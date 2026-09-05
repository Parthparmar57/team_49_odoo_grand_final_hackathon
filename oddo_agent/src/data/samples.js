/**
 * Sample employee emails used to demo the pipeline. Grouped by intent, one
 * sample per scenario so you can see which agent each one routes to.
 *
 * Pick via EMAIL_SAMPLE, e.g.:
 *   leave.normal, leave.relativeDate, leave.incomplete
 *   leave.priyaWedding, leave.amitIncomplete
 *   payroll.payslip, payroll.salaryDifference, payroll.pf
 *   payroll.vinayHRManager, payroll.vickyPayrollUser, payroll.parthPayrollManager
 *   analytics.attendance, analytics.payrollExpense, analytics.employeeAttendance
 */

export const LEAVE_SAMPLES = {
  // Tiny input — smallest Gemini call, fastest result
  minimal: `
From: Rahul Sharma <rahul@technova.com>
Subject: PL Sep 15-16

Need paid leave Sep 15 and Sep 16. Family function.

Thanks,
Rahul
`,

  normal: `
From: Rahul Sharma <rahul@technova.com>
To: hr@technova.com
Subject: Need leave next week

Hi HR Team,

I need to take two days off on September 15 and September 16
as I have to attend a family function outside Ahmedabad.

I would like to use my paid leave balance for these days.

Thanks,
Rahul
`,

  priyaWedding: `
From: Priya Patel <priya@technova.com>
To: hr@technova.com
Subject: Need a couple of days off

Hi HR,

I wanted to take some time off next week because my sister's
wedding is coming up. Ideally I'd like to be away from Monday
through Tuesday and return to work on Wednesday.

I still have some leave left, so please use that if possible.

I have already informed my manager and there shouldn't be
anything urgent pending from my side.

Thanks,
Priya
`,

  relativeDate: `
From: Priya Patel <priya@technova.com>
To: hr@technova.com
Subject: Time off request

Hi HR,

I need Monday and Tuesday off next week because my sister
is getting married and I need to travel home.

Please approve two days from my paid leave balance.

Thanks,
Priya
`,

  incomplete: `
From: Amit Verma <amit@technova.com>
To: hr@technova.com
Subject: Leave needed

Hi HR,

I have some personal work next week and will need a few days off.

Please approve my leave.

Thanks,
Amit
`,

  amitIncomplete: `
From: Amit Verma <amit@technova.com>
To: hr@technova.com
Subject: Need some leave

Hi HR Team,

I have some personal work coming up next week and I won't
be able to work for a few days.

I would like to take leave from my balance. Please process
it and let me know if anything is required from my side.

Thanks,
Amit
`,
};

export const PAYROLL_SAMPLES = {
  payslip: `
From: Rahul Sharma <rahul@technova.com>
To: hr@technova.com
Subject: Query about my June payslip

Hi HR Team,

Could you please explain my June payslip?

I would like to understand my Basic, HRA and the PF and PT
deductions for the month of June.

Thanks,
Rahul
`,

  // HR Manager (vinayvajabs2276@gmail.com) asks a payroll question —
  // DENIED: role has no payroll module access.
  vinayHRManager: `
From: Vinay <vinayvajabs2276@gmail.com>
To: hr@technova.com
Subject: Total payroll expense for June

Hi HR Team,

Could you provide the total payroll expense for all departments
for the month of June?

Thanks,
Vinay
`,

  // HR Payroll User (vicky3213v@gmail.com) asks a payroll question —
  // ALLOWED: role can read payruns/payslips.
  vickyPayrollUser: `
From: Vicky Patel <vicky3213v@gmail.com>
To: hr@technova.com
Subject: August payroll summary

Hi HR Team,

Could you provide the total payroll expense for each department
for August?

Thanks,
Vicky
`,

  // HR Payroll Manager (parthparmar5172@gmail.com) asks a payroll
  // question — ALLOWED: full payroll CRUD.
  parthPayrollManager: `
From: Parth Parmar <parthparmar5172@gmail.com>
To: hr@technova.com
Subject: Payslip breakdown for new joiners

Hi HR Team,

Please share the payslip breakdown for new joiners across
all departments this month.

Thanks,
Parth
`,

  salaryDifference: `
From: Amit Verma <amit@technova.com>
To: payroll@technova.com
Subject: Salary was lower this month

Hi Payroll Team,

I received my salary for August and noticed that it was
lower than usual.

Could you please check whether this was because of my
attendance or leave and explain what changed?

Thanks,
Amit
`,

  pf: `
From: Priya Patel <priya@technova.com>
To: payroll@technova.com
Subject: Question about PF deduction

Hi Payroll Team,

I noticed a PF deduction on my payslip and wanted to understand
how that amount was calculated.

Could you please explain it along with my basic salary?

Thanks,
Priya
`,
};

export const ANALYTICS_SAMPLES = {
  attendance: `
From: Priya Patel <priya@technova.com>
To: hr@technova.com
Subject: Attendance analytics for July

Hi HR Team,

As department head, could you share the department-wise
attendance and pending leave approvals for July 2026?

Thanks,
Priya
`,

  payrollExpense: `
From: Neha Joshi <neha@technova.com>
To: hr@technova.com
Subject: August payroll summary

Hi HR,

Could you provide the total payroll expense for each department
for August 2026?

I need it for our monthly HR review.

Thanks,
Neha
`,

  employeeAttendance: `
From: Arjun Mehta <arjun@technova.com>
To: hr@technova.com
Subject: Attendance summary

Hi HR,

Could you tell me how many days I was present, late, absent,
or had attendance issues during August?

Thanks,
Arjun
`,
};

const SAMPLES = {
  leave: LEAVE_SAMPLES,
  payroll: PAYROLL_SAMPLES,
  analytics: ANALYTICS_SAMPLES,
};

/**
 * Pick a sample email by dot-notation key ("leave.normal",
 * "payroll.payslip", ...). Defaults to the normal leave sample.
 */
export function getSampleEmail(key = "leave.normal") {
  const [group, variant] = String(key).split(".");

  const groupSamples = SAMPLES[group];

  if (!groupSamples) {
    return SAMPLES.leave.normal;
  }

  return groupSamples[variant] || groupSamples[groupSamples === LEAVE_SAMPLES ? "normal" : Object.keys(groupSamples)[0]];
}