import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_employeeId_date_key";`);
    console.log('Successfully dropped unique constraint Attendance_employeeId_date_key');
  } catch (e) {
    console.log('Drop constraint error:', e.message);
  }
}

main().finally(() => prisma.$disconnect());
