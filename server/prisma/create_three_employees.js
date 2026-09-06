import { PrismaClient, Role, EmploymentType, EmployeeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Checking / Creating 3 employees in PostgreSQL database...');

  // Get Engineering Department & Working Schedule
  let dept = await prisma.department.findFirst({ where: { code: 'ENG' } });
  if (!dept) {
    dept = await prisma.department.findFirst();
  }

  let schedule = await prisma.workingSchedule.findFirst();

  const passwordHash = await bcrypt.hash('odoo@123', 10);

  const targets = [
    {
      employeeNumber: 'EMP-001',
      altNumber: 'EMP001',
      firstName: 'Vinay',
      lastName: 'Vaja',
      email: 'vinay.vaja@peoplepay360.com',
      designation: 'Full Stack Developer',
      phone: '+91 98765 43210',
    },
    {
      employeeNumber: 'EMP-002',
      altNumber: 'EMP002',
      firstName: 'Parth',
      lastName: 'Parmar',
      email: 'parth.parmar@peoplepay360.com',
      designation: 'Senior Software Engineer',
      phone: '+91 98765 43211',
    },
    {
      employeeNumber: 'EMP-003',
      altNumber: 'EMP003',
      firstName: 'Harsh',
      lastName: 'Patel',
      email: 'harsh.patel@peoplepay360.com',
      designation: 'DevOps Engineer',
      phone: '+91 98765 43212',
    },
  ];

  for (const t of targets) {
    console.log(`\nProcessing ${t.firstName} ${t.lastName} (${t.employeeNumber})...`);

    // Check if User exists by email
    let user = await prisma.user.findUnique({ where: { email: t.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: t.email,
          passwordHash,
          role: Role.EMPLOYEE,
        },
      });
      console.log(`  ✅ Created User: ${user.email} (Role: ${user.role})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.EMPLOYEE,
          passwordHash,
        },
      });
      console.log(`  ✅ Updated User: ${user.email} (Role: ${user.role})`);
    }

    // Check if Employee exists by employeeNumber, altNumber, or email
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeNumber: t.employeeNumber },
          { employeeNumber: t.altNumber },
          { email: t.email },
        ],
      },
    });

    if (employee) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          employeeNumber: t.employeeNumber,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          designation: t.designation,
          phone: t.phone,
          status: EmployeeStatus.ACTIVE,
          employmentType: EmploymentType.FULL_TIME,
          userId: user.id,
          departmentId: dept.id,
          scheduleId: schedule ? schedule.id : undefined,
        },
      });
      console.log(`  ✅ Updated Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`);
    } else {
      employee = await prisma.employee.create({
        data: {
          employeeNumber: t.employeeNumber,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          designation: t.designation,
          joiningDate: new Date('2024-01-15'),
          employmentType: EmploymentType.FULL_TIME,
          status: EmployeeStatus.ACTIVE,
          departmentId: dept.id,
          scheduleId: schedule ? schedule.id : undefined,
          userId: user.id,
        },
      });
      console.log(`  ✅ Created Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`);
    }
  }

  console.log('\n🎉 All 3 employees & users verified and saved into PostgreSQL successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
