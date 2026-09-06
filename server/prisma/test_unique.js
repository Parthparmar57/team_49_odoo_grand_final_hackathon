import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({ where: { employeeNumber: 'EMP-001' } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const r1 = await prisma.attendance.create({
      data: {
        employeeId: emp.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });
    console.log('Created r1:', r1.id);
  } catch (e) {
    console.log('r1 error:', e.message);
  }

  try {
    const r2 = await prisma.attendance.create({
      data: {
        employeeId: emp.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });
    console.log('Created r2:', r2.id);
  } catch (e) {
    console.log('r2 error (unique constraint):', e.code);
  }
}

main().finally(() => prisma.$disconnect());
