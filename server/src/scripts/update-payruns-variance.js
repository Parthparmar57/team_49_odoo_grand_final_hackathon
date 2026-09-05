import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating database payruns with monthly payroll variance...');
    const payruns = await prisma.payrun.findMany({
        orderBy: { periodStart: 'asc' }
    });

    const factors = [0.86, 0.91, 0.96, 1.00];

    for (let idx = 0; idx < payruns.length; idx++) {
        const pr = payruns[idx];
        const factor = factors[idx] || 1.0;

        const payslips = await prisma.payslip.findMany({
            where: { payrunId: pr.id }
        });

        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        for (const ps of payslips) {
            const basic = Math.round(ps.basicSalary * factor * 100) / 100;
            const gross = Math.round(ps.grossSalary * factor * 100) / 100;
            const allowances = Math.round(ps.totalAllowances * factor * 100) / 100;
            const deductions = Math.round(ps.totalDeductions * factor * 100) / 100;
            const net = Math.round((gross - deductions) * 100) / 100;

            await prisma.payslip.update({
                where: { id: ps.id },
                data: {
                    basicSalary: basic,
                    grossSalary: gross,
                    totalAllowances: allowances,
                    totalDeductions: deductions,
                    netSalary: net,
                }
            });

            totalGross += gross;
            totalDeductions += deductions;
            totalNet += net;
        }

        await prisma.payrun.update({
            where: { id: pr.id },
            data: {
                totalGross: Math.round(totalGross * 100) / 100,
                totalDeductions: Math.round(totalDeductions * 100) / 100,
                totalNet: Math.round(totalNet * 100) / 100,
            }
        });

        console.log(`✅ Updated ${pr.payrunRef} (${pr.name}): Total Net = ₹${Math.round(totalNet).toLocaleString('en-IN')}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
