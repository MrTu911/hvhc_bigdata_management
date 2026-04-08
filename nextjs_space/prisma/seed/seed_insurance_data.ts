/**
 * Seed additional Insurance Data
 * Tạo đóng góp, người phụ thuộc và yêu cầu chế độ cho các hồ sơ BHXH hiện có
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const RANK_COEFFICIENTS: Record<string, number> = {
  'Đại tướng': 10.4, 'Thượng tướng': 9.8, 'Trung tướng': 9.2, 'Thiếu tướng': 8.6,
  'Đại tá': 8.0, 'Thượng tá': 7.3, 'Trung tá': 6.6, 'Thiếu tá': 6.0,
  'Đại úy': 5.4, 'Thượng úy': 4.8, 'Trung úy': 4.2, 'Thiếu úy': 3.6,
  'Thượng sĩ': 3.2, 'Trung sĩ': 2.8, 'Hạ sĩ': 2.4, 'Binh nhất': 2.0, 'Binh nhì': 1.8,
};

const BASE_SALARY = 1_800_000;
const EMPLOYEE_RATE = 0.105;
const EMPLOYER_RATE = 0.215;

const hospitals = [
  'Bệnh viện Trung ương Quân đội 108', 'Bệnh viện Quân y 103', 'Bệnh viện Quân y 354',
  'Bệnh viện Quân y 175', 'Bệnh viện Bạch Mai', 'Bệnh xá Học viện Hậu cần',
];

const CLAIM_TYPES = ['SICK_LEAVE', 'MATERNITY', 'MEDICAL_EXPENSE', 'WORK_ACCIDENT'] as const;
const CLAIM_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID'] as const;
const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT'] as const;
const NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng', 'Phạm Minh Tuấn', 'Hoàng Thị Lan',
  'Vũ Đức Mạnh', 'Đỗ Thị Hạnh', 'Bùi Văn Nam', 'Nguyễn Thị Hạnh', 'Trần Văn Hùng',
];

async function main() {
  const currentYear = 2026;
  console.log('🚀 Bắt đầu tạo dữ liệu BHXH...');
  
  // Get all insurance infos with user rank
  const infos = await prisma.insuranceInfo.findMany({
    include: { user: { select: { rank: true } } },
  });
  
  console.log(`📝 Tìm thấy ${infos.length} hồ sơ BHXH`);

  let contribs = 0, deps = 0, claims = 0;
  
  for (const info of infos) {
    // Check if contributions exist for this info
    const existingContrib = await prisma.insuranceHistory.findFirst({
      where: { insuranceInfoId: info.id, transactionType: 'CONTRIBUTION' },
    });
    
    if (!existingContrib) {
      const coef = RANK_COEFFICIENTS[info.user?.rank || ''] || 3.0;
      const salary = Math.round(BASE_SALARY * coef);
      const empShare = Math.round(salary * EMPLOYEE_RATE);
      const emplerShare = Math.round(salary * EMPLOYER_RATE);
      const total = empShare + emplerShare;
      
      // Create 6 months of contributions
      for (let m = 1; m <= 6; m++) {
        await prisma.insuranceHistory.create({
          data: {
            insuranceInfoId: info.id,
            transactionType: 'CONTRIBUTION',
            periodMonth: m,
            periodYear: currentYear,
            baseSalary: salary,
            amount: total,
            employeeShare: empShare,
            employerShare: emplerShare,
            documentNumber: `CT-BHXH-${currentYear}-${String(m).padStart(2, '0')}`,
          },
        });
        contribs++;
      }
    }
    
    // Add dependent (30% chance)
    const existingDep = await prisma.insuranceDependent.findFirst({ where: { insuranceInfoId: info.id } });
    if (!existingDep && Math.random() < 0.3) {
      await prisma.insuranceDependent.create({
        data: {
          insuranceInfoId: info.id,
          fullName: NAMES[Math.floor(Math.random() * NAMES.length)],
          relationship: RELATIONSHIPS[Math.floor(Math.random() * RELATIONSHIPS.length)],
          gender: Math.random() > 0.5 ? 'Nam' : 'Nữ',
          dateOfBirth: new Date(currentYear - 20 - Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          healthInsuranceNumber: 'QD3' + Math.floor(Math.random() * 9000000000 + 1000000000),
          healthInsuranceStartDate: new Date(`${currentYear}-01-01`),
          healthInsuranceEndDate: new Date(`${currentYear}-12-31`),
          healthInsuranceHospital: hospitals[Math.floor(Math.random() * hospitals.length)],
          status: 'ACTIVE',
        },
      });
      deps++;
    }
    
    // Add claim (15% chance)
    const existingClaim = await prisma.insuranceClaim.findFirst({ where: { insuranceInfoId: info.id } });
    if (!existingClaim && Math.random() < 0.15) {
      const claimType = CLAIM_TYPES[Math.floor(Math.random() * CLAIM_TYPES.length)];
      const status = CLAIM_STATUSES[Math.floor(Math.random() * CLAIM_STATUSES.length)];
      const amount = Math.floor(Math.random() * 5000000) + 500000;
      await prisma.insuranceClaim.create({
        data: {
          insuranceInfoId: info.id,
          claimType: claimType,
          status: status,
          amount: amount,
          calculatedAmount: (status === 'APPROVED' || status === 'PAID') ? amount : null,
          benefitDays: claimType === 'SICK_LEAVE' ? Math.floor(Math.random() * 10) + 1 : null,
          startDate: new Date(currentYear, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
          reason: claimType === 'SICK_LEAVE' ? 'Ốm đau thông thường' : (claimType === 'MATERNITY' ? 'Nghỉ thai sản' : 'Chi phí KCB'),
          hospitalName: hospitals[Math.floor(Math.random() * hospitals.length)],
          submittedAt: new Date(),
        },
      });
      claims++;
    }
  }
  
  console.log(`\n✅ Kết quả:`);
  console.log(`  - Tạo ${contribs} bản ghi đóng góp`);
  console.log(`  - Tạo ${deps} người phụ thuộc`);
  console.log(`  - Tạo ${claims} yêu cầu chế độ`);
  
  // Final counts
  const [totalContribs, totalDeps, totalClaims] = await Promise.all([
    prisma.insuranceHistory.count({ where: { transactionType: 'CONTRIBUTION' } }),
    prisma.insuranceDependent.count(),
    prisma.insuranceClaim.count(),
  ]);
  
  console.log(`\n📊 Tổng kết cuối:`);
  console.log(`  - Tổng đóng góp: ${totalContribs}`);
  console.log(`  - Tổng người PT: ${totalDeps}`);
  console.log(`  - Tổng yêu cầu: ${totalClaims}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
