import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.attendance.count();
  console.log('Total attendance records in DB:', count);
  const rows = await prisma.attendance.findMany({ take: 3 });
  console.log('Sample rows:', rows);
}

main().finally(() => prisma.$disconnect());
