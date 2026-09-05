import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emps = await prisma.employee.findMany({
    where: {
      employeeNumber: { in: ['EMP-001', 'EMP-002', 'EMP-003'] },
    },
    include: {
      contracts: true,
      user: true,
      department: true,
    },
  });

  const structTech = await prisma.salaryStructure.findFirst({
    where: { code: 'SWE-STD' },
  }) || await prisma.salaryStructure.findFirst();

  for (const emp of emps) {
    console.log(`\nEmployee: ${emp.firstName} ${emp.lastName} | ID: ${emp.employeeNumber} | User: ${emp.user?.email} (${emp.user?.role})`);

    if (!emp.contracts || emp.contracts.length === 0) {
      const contract = await prisma.contract.create({
        data: {
          contractRef: `CNT-${emp.employeeNumber}`,
          employeeId: emp.id,
          departmentId: emp.departmentId,
          salaryStructureId: structTech ? structTech.id : undefined,
          scheduleId: emp.scheduleId,
          wage: 75000.0,
          status: ContractStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
        },
      });
      console.log(`  ✅ Created Active Contract: ${contract.contractRef} (Wage: ₹${contract.wage})`);
    } else {
      console.log(`  ✅ Existing Contract: ${emp.contracts[0].contractRef} (Status: ${emp.contracts[0].status})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
