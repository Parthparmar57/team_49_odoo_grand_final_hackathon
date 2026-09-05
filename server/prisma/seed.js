import { PrismaClient, Role, EmploymentType, EmployeeStatus, ContractStatus, LeaveUnit, RuleCategory, CalculationMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding PeoplePay360 database (Pure JavaScript)...');

    // Clean existing data
    await prisma.aIExecution.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.payslipLine.deleteMany();
    await prisma.payslip.deleteMany();
    await prisma.payrun.deleteMany();
    await prisma.salaryRule.deleteMany();
    await prisma.salaryStructure.deleteMany();
    await prisma.leaveRequest.deleteMany();
    await prisma.leaveAllocation.deleteMany();
    await prisma.leaveType.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.workingSchedule.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();

    // Create Departments
    const deptEngineering = await prisma.department.create({
        data: { name: 'Engineering', code: 'ENG', description: 'Software Development & Technical Operations' },
    });

    const deptHR = await prisma.department.create({
        data: { name: 'Human Resources', code: 'HR', description: 'People & Culture, Talent Acquisition, Payroll' },
    });

    // Create Working Schedule
    const scheduleStandard = await prisma.workingSchedule.create({
        data: {
            name: 'Standard Full-Time (40h/week)',
            weeklyHours: 40,
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
        },
    });

    // Create Users & Employees for all 5 Roles
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const adminUser = await prisma.user.create({
        data: { email: 'admin@peoplepay360.com', passwordHash, role: Role.ADMIN },
    });

    const hrManagerUser = await prisma.user.create({
        data: { email: 'hr.manager@peoplepay360.com', passwordHash, role: Role.HR_MANAGER },
    });

    const payrollUser = await prisma.user.create({
        data: { email: 'payroll.user@peoplepay360.com', passwordHash, role: Role.HR_PAYROLL_USER },
    });

    const payrollMgrUser = await prisma.user.create({
        data: { email: 'payroll.manager@peoplepay360.com', passwordHash, role: Role.HR_PAYROLL_MANAGER },
    });

    const employeeUser = await prisma.user.create({
        data: { email: 'rahul@example.com', passwordHash, role: Role.EMPLOYEE },
    });

    // Create Employee Records
    const empRahul = await prisma.employee.create({
        data: {
            employeeNumber: 'EMP001',
            firstName: 'Rahul',
            lastName: 'Sharma',
            email: 'rahul@example.com',
            phone: '+919876543210',
            designation: 'Senior Software Engineer',
            joiningDate: new Date('2023-01-15'),
            employmentType: EmploymentType.FULL_TIME,
            status: EmployeeStatus.ACTIVE,
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            ifscCode: 'HDFC0001234',
            taxId: 'ABCDE1234F',
            departmentId: deptEngineering.id,
            scheduleId: scheduleStandard.id,
            userId: employeeUser.id,
        },
    });

    const empHRManager = await prisma.employee.create({
        data: {
            employeeNumber: 'EMP002',
            firstName: 'Priya',
            lastName: 'Verma',
            email: 'hr.manager@peoplepay360.com',
            designation: 'HR Manager',
            joiningDate: new Date('2022-05-01'),
            employmentType: EmploymentType.FULL_TIME,
            status: EmployeeStatus.ACTIVE,
            bankName: 'ICICI Bank',
            accountNumber: '60200987654321',
            departmentId: deptHR.id,
            scheduleId: scheduleStandard.id,
            userId: hrManagerUser.id,
        },
    });

    // Update Rahul's Manager
    await prisma.employee.update({
        where: { id: empRahul.id },
        data: { managerId: empHRManager.id },
    });

    // Create Leave Types
    const leaveAnnual = await prisma.leaveType.create({
        data: {
            name: 'Annual Leave',
            code: 'AL',
            unit: LeaveUnit.DAYS,
            requiresAllocation: true,
            approvalRequired: true,
            payrollImpact: true,
            description: 'Paid annual leave allocation (12 days/year)',
        },
    });

    const leaveCasual = await prisma.leaveType.create({
        data: {
            name: 'Casual Leave',
            code: 'CL',
            unit: LeaveUnit.DAYS,
            requiresAllocation: true,
            approvalRequired: true,
            payrollImpact: true,
            description: 'Casual leave entitlement',
        },
    });

    // Create Leave Allocations
    await prisma.leaveAllocation.create({
        data: {
            employeeId: empRahul.id,
            leaveTypeId: leaveAnnual.id,
            allocatedAmount: 12,
            usedAmount: 2,
            remainingAmount: 10,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-12-31'),
        },
    });

    await prisma.leaveAllocation.create({
        data: {
            employeeId: empRahul.id,
            leaveTypeId: leaveCasual.id,
            allocatedAmount: 6,
            usedAmount: 0,
            remainingAmount: 6,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-12-31'),
        },
    });

    // Create Salary Structure & Rules
    const structureStandard = await prisma.salaryStructure.create({
        data: {
            name: 'Standard Software Engineer Structure',
            code: 'SWE-STD',
            description: 'Base salary structure with Basic, HRA, TA, PF deduction',
        },
    });

    // Rules: Basic (40% of wage), HRA (50% of Basic), TA (fixed 5000), PF deduction (12% of Basic)
    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'Basic Salary',
            code: 'BASIC',
            category: RuleCategory.BASIC,
            sequence: 10,
            computationMethod: CalculationMethod.PERCENTAGE,
            percentage: 40,
            active: true,
        },
    });

    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'House Rent Allowance',
            code: 'HRA',
            category: RuleCategory.ALLOWANCE,
            sequence: 20,
            computationMethod: CalculationMethod.PERCENTAGE,
            percentage: 50,
            percentageBasedOn: 'BASIC',
            active: true,
        },
    });

    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'Transport Allowance',
            code: 'TA',
            category: RuleCategory.ALLOWANCE,
            sequence: 30,
            computationMethod: CalculationMethod.FIXED,
            amount: 5000,
            active: true,
        },
    });

    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'Gross Salary',
            code: 'GROSS',
            category: RuleCategory.GROSS,
            sequence: 40,
            computationMethod: CalculationMethod.FORMULA,
            formula: 'BASIC + HRA + TA',
            active: true,
        },
    });

    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'Provident Fund',
            code: 'PF',
            category: RuleCategory.DEDUCTION,
            sequence: 50,
            computationMethod: CalculationMethod.PERCENTAGE,
            percentage: 12,
            percentageBasedOn: 'BASIC',
            active: true,
        },
    });

    await prisma.salaryRule.create({
        data: {
            salaryStructureId: structureStandard.id,
            name: 'Net Salary',
            code: 'NET',
            category: RuleCategory.NET,
            sequence: 60,
            computationMethod: CalculationMethod.FORMULA,
            formula: 'GROSS - PF',
            active: true,
        },
    });

    // Create Contract
    await prisma.contract.create({
        data: {
            contractRef: 'CNT-2026-RAHUL',
            employeeId: empRahul.id,
            departmentId: deptEngineering.id,
            scheduleId: scheduleStandard.id,
            salaryStructureId: structureStandard.id,
            wage: 100000, // 1 Lakh / month
            startDate: new Date('2026-01-01'),
            status: ContractStatus.ACTIVE,
        },
    });

    console.log('✅ Database seeded successfully with 5 roles, departments, employees, contracts, and salary rules.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
