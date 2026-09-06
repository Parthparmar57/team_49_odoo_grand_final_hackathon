import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function seedArjunAttendance() {
    console.log('🚀 Seeding attendance data for Arjun Trivedi (EMP018)...');

    const logsPath = path.resolve(__dirname, '../../../transfer_learning/attendance_logs.json');
    let logs = [];
    if (fs.existsSync(logsPath)) {
        try {
            logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]');
        } catch (_) { }
    }

    const arjun = await prisma.employee.findFirst({
        where: { employeeNumber: 'EMP018' },
    });

    if (!arjun) {
        console.error('❌ Employee EMP018 (Arjun Trivedi) not found in database.');
        process.exit(1);
    }

    console.log(`✅ Found Employee: ${arjun.firstName} ${arjun.lastName} (${arjun.employeeNumber})`);

    // Create 15 recent biometric attendance logs for Arjun Trivedi in attendance_logs.json
    const dates = [
        '2026-09-06', '2026-09-05', '2026-09-04', '2026-09-03', '2026-09-02', '2026-09-01',
        '2026-08-31', '2026-08-28', '2026-08-27', '2026-08-26', '2026-08-25', '2026-08-24',
        '2026-08-21', '2026-08-20', '2026-08-19'
    ];

    const newLogs = [];

    for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        const id = `ATT-ARJUN-${Date.now() - i * 86400000}`;
        const checkInHour = 8 + (i % 2 === 0 ? 0 : 1);
        const checkInMin = 50 + (i % 9);
        const checkOutHour = 18;
        const checkOutMin = 5 + (i % 15);

        const checkInIso = `${d}T${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`;
        const checkOutIso = `${d}T${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`;
        const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00 AM`;
        const checkOutTime = `06:${String(checkOutMin).padStart(2, '0')}:00 PM`;

        const workedHours = 8.0 + (i % 3) * 0.25;

        newLogs.push({
            id,
            employee: {
                firstName: arjun.firstName,
                lastName: arjun.lastName,
                employeeNumber: arjun.employeeNumber,
            },
            employeeNumber: arjun.employeeNumber,
            name: `${arjun.firstName} ${arjun.lastName}`,
            date: d,
            checkIn: checkInIso,
            checkInTime: checkInTime,
            checkOut: checkOutIso,
            checkOutTime: checkOutTime,
            workedHours: Number(workedHours.toFixed(2)),
            overtimeHours: (i % 3) * 0.25,
            status: i === 3 ? 'LATE' : i === 7 ? 'HALF_DAY' : 'PRESENT',
            actions: '',
            matchConfidence: 94.2 + (i % 5),
        });
    }

    // Filter out previous dummy Arjun records if any, then prepend new ones
    const filteredOld = logs.filter((l) => l.employeeNumber !== 'EMP018');
    const combinedLogs = [...newLogs, ...filteredOld];

    fs.writeFileSync(logsPath, JSON.stringify(combinedLogs, null, 2), 'utf-8');
    console.log(`✅ Successfully seeded ${newLogs.length} biometric attendance logs for Arjun Trivedi in attendance_logs.json`);

    await prisma.$disconnect();
}

seedArjunAttendance().catch(err => {
    console.error('Error seeding Arjun attendance:', err);
    process.exit(1);
});
