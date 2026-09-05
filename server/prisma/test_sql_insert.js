import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({ where: { employeeNumber: 'EMP-001' } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const id = crypto.randomUUID();
  const now = new Date();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Attendance" ("id", "employeeId", "date", "checkIn", "checkOut", "workedHours", "status", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7::"AttendanceStatus", $8, $9)`,
    id, emp.id, today, now, null, 0.0, 'PRESENT', now, now
  );
  console.log('Successfully inserted new attendance entry via SQL:', id);
}

main().finally(() => prisma.$disconnect());
