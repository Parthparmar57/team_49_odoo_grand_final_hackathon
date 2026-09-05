# 🚀 PeoplePay360 HR & Payroll — 3-Developer Conflict-Free Task Allocation

> **Objective**: Complete all pending requirements from `docs/PeoplePay360 HR & Payroll.pdf` by splitting work cleanly across **3 Developers** with **zero file overlapping** and **zero Git merge conflicts**.

---

## 🛡️ Architecture & Module Boundary Strategy

To prevent merge conflicts, each developer works exclusively in dedicated directories and separate feature files:

```
├── Developer 1: Salary Structures, Rules Engine & RBAC Security
│   ├── client/src/features/payroll/structures/* [NEW]
│   ├── client/src/features/admin/UserManagementPage.tsx [NEW]
│   ├── server/src/modules/payroll/payroll.routes.js (RBAC fix)
│   └── server/src/modules/payroll/structures.service.js [NEW]
│
├── Developer 2: Payrun Wizard, Payslips, Warnings & Bulk Email
│   ├── client/src/features/payroll/PayrunWizardModal.tsx [NEW]
│   ├── client/src/features/payroll/PayrunDetail.tsx
│   ├── client/src/features/payroll/PayslipsListPage.tsx [NEW]
│   └── server/src/modules/email/email.controller.js
│
└── Developer 3: Dashboard Analytics & HR Master Data Polish
    ├── client/src/features/dashboard/*
    ├── client/src/features/employees/EmployeeDetail.tsx (Smart Buttons)
    ├── client/src/features/schedules/SchedulesPage.tsx (Auto Hours)
    └── server/src/modules/dashboard/*
```

---

## 👤 DEVELOPER 1: Salary Structures, Rules Engine & RBAC Enforcement

### 🎯 Scope & Responsibilities
Developer 1 handles all **Salary Structures & Rules Configuration**, formula building logic, and **Backend RBAC Security**.

### 📄 Target Files & Modules
* `[NEW]` `client/src/features/payroll/structures/SalaryStructuresPage.tsx`
* `[NEW]` `client/src/features/payroll/structures/SalaryStructureForm.tsx`
* `[NEW]` `client/src/features/payroll/structures/SalaryRulesModal.tsx`
* `[NEW]` `client/src/features/admin/UserManagementPage.tsx`
* `[MODIFY]` `server/src/modules/payroll/payroll.routes.js`
* `[MODIFY]` `client/src/routes/AppRoutes.tsx` (Route registration only)

### 📋 Detailed Task List
1. **Fix Backend RBAC Permissions Matrix (`payroll.routes.js`)**:
   * Restrict `POST /structures`, `POST /payruns`, and `POST /payruns/:id/compute` to remove `HR_MANAGER` access.
   * Ensure `HR_PAYROLL_USER` has Read-Only access to Structures/Rules and Write access to Payruns.
   * Ensure `HR_PAYROLL_MANAGER` and `ADMIN` have full CRUD access.
2. **Salary Structure Management UI (PDF Section A5)**:
   * Build `SalaryStructuresPage.tsx` (List view displaying structure name, code, rule count, active status).
   * Build `SalaryStructureForm.tsx` (Create/Edit structures).
3. **Salary Rules Builder UI & Sequence Engine (PDF Section A6)**:
   * Build `SalaryRulesModal.tsx` allowing users to add/edit rules on a structure.
   * Configure Rule Categories (`BASIC`, `ALLOWANCE`, `GROSS`, `DEDUCTION`, `NET`).
   * Configure Computation Method (`FIXED` amount, `PERCENTAGE`, `FORMULA`).
   * Add execution sequence selector so rules evaluate in dependency order.
4. **Admin User & Role Management Screen (PDF Section 3)**:
   * Build `UserManagementPage.tsx` under `/admin/users` displaying user list, assigned employee, and role update dropdown (`EMPLOYEE`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`).

---

## 👤 DEVELOPER 2: Payrun Wizard, Payslips, Payroll Warnings & Bulk Email

### 🎯 Scope & Responsibilities
Developer 2 handles the **2-Step Payrun Creation Wizard**, **Payrun Processing screen**, **Payroll Warnings display**, **Bulk Email distribution**, and **Standalone Payslips view**.

### 📄 Target Files & Modules
* `[NEW]` `client/src/features/payroll/PayrunWizardModal.tsx`
* `[NEW]` `client/src/features/payroll/PayslipsListPage.tsx`
* `[MODIFY]` `client/src/features/payroll/PayrunDetail.tsx`
* `[MODIFY]` `client/src/features/payroll/PayrollPage.tsx`
* `[MODIFY]` `server/src/modules/payroll/payroll.service.js`
* `[MODIFY]` `server/src/modules/email/email.controller.js`

### 📋 Detailed Task List
1. **Payrun 2-Step Creation Wizard (PDF Section B5)**:
   * Build `PayrunWizardModal.tsx` replacing the simple modal:
     * **Step 1 (Scope & Period)**: Salary Structure selection, Period Start & End dates. Clicking *Continue* proceeds without saving to DB.
     * **Step 2 (Employee Selection)**: Filter and multi-select eligible active employees with checkbox select/deselect all.
     * **Finalize**: Submit `employeeIds` array to backend `POST /api/payroll/payruns`.
2. **Backend Payrun Initializer Update (`payroll.service.js`)**:
   * Update `createPayrun` to accept `employeeIds` array and initialize batch payslips for *only* selected staff.
3. **Payroll Warnings & Alerts UI (`PayrunDetail.tsx`) (PDF Section B6 & Technical Guidelines)**:
   * Fetch `PayrollWarning` records for the payrun.
   * Display visual alert cards/banners for missing bank details, missing tax IDs, zero worked hours, or duplicate payslips prior to validation.
4. **Bulk Email Payslip Delivery ("Send Payslips") (PDF Section B8)**:
   * Add **"Send Payslips"** button on `PayrunDetail.tsx`.
   * Connect to backend bulk email endpoint to dispatch PDF attachments and update `emailSent` status flags.
5. **Standalone Payslips List View (`PayslipsListPage.tsx`) (PDF Section B7)**:
   * Build `/payroll/payslips` route displaying global list of generated employee payslips with search, status filters, and individual PDF download buttons.

---

## 👤 DEVELOPER 3: Dashboard Analytics, Live Filters & HR Master Data Polish

### 🎯 Scope & Responsibilities
Developer 3 handles **Real-Time Dashboard Analytics**, **Dynamic Charts**, **Top Dashboard Filters**, **Employee Smart-Button Counts**, and **Working Schedule Auto-Calculations**.

### 📄 Target Files & Modules
* `[MODIFY]` `client/src/features/dashboard/DashboardPage.tsx`
* `[MODIFY]` `server/src/modules/dashboard/dashboard.service.js`
* `[MODIFY]` `server/src/modules/dashboard/dashboard.controller.js`
* `[MODIFY]` `client/src/features/employees/EmployeeDetail.tsx`
* `[MODIFY]` `client/src/features/schedules/SchedulesPage.tsx`

### 📋 Detailed Task List
1. **Dynamic Dashboard Analytics & Live Data (`DashboardPage.tsx`) (PDF Section A7 & B9)**:
   * Replace hardcoded metric cards with live data from `GET /api/dashboard/overview` & `GET /api/dashboard/payroll`.
   * Connect KPI cards: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health.
2. **Dynamic Charts & Department Breakdown (PDF Section B9)**:
   * Update `dashboard.service.js` to compute department salary cost breakdown & monthly net salary trends.
   * Render dynamic SVG chart paths based on real database records instead of static mock lines.
3. **Dashboard Top Filter Controls (PDF Section A7 & B9)**:
   * Add top filter bar to `DashboardPage.tsx`: **Period Selector**, **Department Filter**, and **Employee Type Filter** (`FULL_TIME`, `CONTRACT`, etc.).
   * Pass filter parameters to backend dashboard endpoint to recalculate metrics dynamically.
4. **Employee Form Smart-Button Counts & Allocations (PDF Section A1 & B2)**:
   * Update `EmployeeDetail.tsx` smart buttons to query and display exact counts:
     * `Contracts (N)`
     * `Attendance (N)`
     * `Time Off Requests (N)`
     * `Leave Allocations (N)` (Add missing Allocations button & modal view).
5. **Working Schedule Weekly Hours Auto-Calculation (`SchedulesPage.tsx`) (PDF Section A3)**:
   * Modify creation modal in `SchedulesPage.tsx` so `weeklyHours` auto-calculates as:
     `[ (End Time - Start Time) - (Break Minutes / 60) ] * Total Selected Active Days`
   * Disable manual typing for `weeklyHours` to enforce rule calculation.

---

## 🔀 Git Branch & Integration Workflow

To guarantee zero merge conflicts during team collaboration:

1. **Branch Naming**:
   * Developer 1: `git checkout -b feature/payroll-rules-rbac`
   * Developer 2: `git checkout -b feature/payrun-wizard-email`
   * Developer 3: `git checkout -b feature/dashboard-master-data`
2. **Conflict Prevention Checklist**:
   * ✅ No developer modifies the same frontend component file.
   * ✅ Developer 1 owns `payroll.routes.js` and `structures/*`.
   * ✅ Developer 2 owns `PayrunWizardModal.tsx`, `PayrunDetail.tsx`, and `email.controller.js`.
   * ✅ Developer 3 owns `DashboardPage.tsx`, `dashboard.service.js`, `EmployeeDetail.tsx`, and `SchedulesPage.tsx`.
3. **AppRoutes Integration**:
   * Developer 1, 2, and 3 will append their respective route entries to `AppRoutes.tsx` inside dedicated block comments.

---

### 📌 Summary Table

| Developer | Core Focus | Key New Files | Primary Responsibility |
|---|---|---|---|
| **Dev 1** | Rules Engine & RBAC | `SalaryStructuresPage.tsx`, `SalaryRulesModal.tsx`, `UserManagementPage.tsx` | Salary Structures/Rules Builder, RBAC route security, Admin User Panel |
| **Dev 2** | Payruns & Emails | `PayrunWizardModal.tsx`, `PayslipsListPage.tsx` | 2-step Payrun setup wizard, Payroll warnings, Bulk email payslips |
| **Dev 3** | Analytics & HR Polish | Modify `DashboardPage.tsx`, `EmployeeDetail.tsx`, `SchedulesPage.tsx` | Live Dashboard KPIs & charts, Period/Dept filters, Smart-button counts, Auto schedule hours |
