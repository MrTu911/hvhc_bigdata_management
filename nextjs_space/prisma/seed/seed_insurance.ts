/**
 * Seed Insurance Data - Dữ liệu mẫu BHXH
 * - InsuranceInfo cho tất cả cán bộ
 * - InsuranceHistory (đóng góp hàng tháng)
 * - InsuranceDependent (người phụ thuộc)
 * - InsuranceClaim (yêu cầu chế độ)
 * - MedicalFacility (cơ sở KCB)
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Hệ số lương theo cấp bậc
const RANK_COEFFICIENTS: Record<string, number> = {
  'Đại tướng': 10.4,
  'Thượng tướng': 9.8,
  'Trung tướng': 9.2,
  'Thiếu tướng': 8.6,
  'Đại tá': 8.0,
  'Thượng tá': 7.3,
  'Trung tá': 6.6,
  'Thiếu tá': 6.0,
  'Đại úy': 5.4,
  'Thượng úy': 4.8,
  'Trung úy': 4.2,
  'Thiếu úy': 3.6,
  'Thượng sĩ': 3.2,
  'Trung sĩ': 2.8,
  'Hạ sĩ': 2.4,
  'Binh nhất': 2.0,
  'Binh nhì': 1.8,
};

const BASE_SALARY = 1_800_000;
const EMPLOYEE_RATE = 0.105; // 10.5%
const EMPLOYER_RATE = 0.215; // 21.5%

// Medical facilities data
const MEDICAL_FACILITIES = [
  { code: 'BV108', name: 'Bệnh viện Trung ương Quân đội 108', type: 'MILITARY_HOSPITAL', province: 'Hà Nội', level: 1 },
  { code: 'BV103', name: 'Bệnh viện Quân y 103', type: 'MILITARY_HOSPITAL', province: 'Hà Nội', level: 1 },
  { code: 'BV354', name: 'Bệnh viện Quân y 354', type: 'MILITARY_HOSPITAL', province: 'Hà Nội', level: 2 },
  { code: 'BV175', name: 'Bệnh viện Quân y 175', type: 'MILITARY_HOSPITAL', province: 'TP HCM', level: 1 },
  { code: 'BV87', name: 'Bệnh viện Quân y 87', type: 'MILITARY_HOSPITAL', province: 'Khánh Hòa', level: 2 },
  { code: 'BVBMHC', name: 'Bệnh xá Học viện Hậu cần', type: 'CLINIC', province: 'Hà Nội', level: 3 },
  { code: 'BV5', name: 'Bệnh viện Quân y 5', type: 'MILITARY_HOSPITAL', province: 'Ninh Bình', level: 2 },
  { code: 'BV4', name: 'Bệnh viện Quân y 4', type: 'MILITARY_HOSPITAL', province: 'Nghệ An', level: 2 },
  { code: 'BVBM', name: 'Bệnh viện Bạch Mai', type: 'CENTRAL_HOSPITAL', province: 'Hà Nội', level: 1 },
  { code: 'BVVD', name: 'Bệnh viện Việt Đức', type: 'CENTRAL_HOSPITAL', province: 'Hà Nội', level: 1 },
];

function generateInsuranceNumber(): string {
  const prefix = 'HC'; // Học viện Hậu cần
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefix}${random}`;
}

function generateHealthInsuranceNumber(): string {
  const prefix = 'QD3'; // Quân đội - tuyến 3
  const random = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefix}${random}`;
}

function calculateContribution(rank: string) {
  const coef = RANK_COEFFICIENTS[rank] || 3.0;
  const salary = Math.round(BASE_SALARY * coef);
  return {
    baseSalary: salary,
    employeeShare: Math.round(salary * EMPLOYEE_RATE),
    employerShare: Math.round(salary * EMPLOYER_RATE),
    total: Math.round(salary * (EMPLOYEE_RATE + EMPLOYER_RATE)),
  };
}

const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT'] as const;
const GENDERS = ['Nam', 'Nữ'] as const;
const DEPENDENT_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng', 'Phạm Minh Tuấn', 'Hoàng Thị Lan',
  'Vũ Đức Mạnh', 'Đỗ Thị Hạnh', 'Bùi Văn Nam', 'Nguyễn Thị Hạnh', 'Trần Văn Hùng',
];

const CLAIM_TYPES = ['SICK_LEAVE', 'MATERNITY', 'MEDICAL_EXPENSE', 'WORK_ACCIDENT'] as const;
const CLAIM_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PAID'] as const;

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu BHXH...');

  // 1. Seed Medical Facilities
  console.log('\n🏥 Seed cơ sở KCB...');
  for (const facility of MEDICAL_FACILITIES) {
    const existing = await prisma.medicalFacility.findUnique({ where: { code: facility.code } });
    if (!existing) {
      await prisma.medicalFacility.create({
        data: {
          ...facility,
          type: facility.type as any,
          address: `${facility.province}`,
          isActive: true,
          contractStartDate: new Date('2024-01-01'),
          contractEndDate: new Date('2025-12-31'),
        },
      });
      console.log(`  ✔ Created: ${facility.name}`);
    } else {
      console.log(`  - Exists: ${facility.name}`);
    }
  }

  // 2. Get all active users
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, rank: true, dateOfBirth: true },
    take: 300,
  });
  console.log(`\n👥 Tìm thấy ${users.length} cán bộ`);

  // 3. Create InsuranceInfo for users without it
  console.log('\n📝 Tạo thông tin BHXH...');
  let createdInsurance = 0;
  const currentYear = new Date().getFullYear();
  const hospitals = MEDICAL_FACILITIES.map(f => f.name);

  for (const user of users) {
    const existing = await prisma.insuranceInfo.findUnique({ where: { userId: user.id } });
    if (!existing) {
      const startYear = currentYear - Math.floor(Math.random() * 10) - 1;
      const insuranceInfo = await prisma.insuranceInfo.create({
        data: {
          userId: user.id,
          insuranceNumber: generateInsuranceNumber(),
          insuranceStartDate: new Date(`${startYear}-01-01`),
          healthInsuranceNumber: generateHealthInsuranceNumber(),
          healthInsuranceStartDate: new Date(`${currentYear}-01-01`),
          healthInsuranceEndDate: new Date(`${currentYear}-12-31`),
          healthInsuranceHospital: hospitals[Math.floor(Math.random() * hospitals.length)],
        },
      });

      // Create contributions for past 6 months
      const contribution = calculateContribution(user.rank || 'Trung úy');
      for (let m = 1; m <= 6; m++) {
        await prisma.insuranceHistory.create({
          data: {
            insuranceInfoId: insuranceInfo.id,
            transactionType: 'CONTRIBUTION',
            periodMonth: m,
            periodYear: currentYear,
            baseSalary: contribution.baseSalary,
            amount: contribution.total,
            employeeShare: contribution.employeeShare,
            employerShare: contribution.employerShare,
            documentNumber: `CT-BHXH-${currentYear}-${m.toString().padStart(2, '0')}`,
          },
        });
      }

      // Random: add dependent (30% chance)
      if (Math.random() < 0.3) {
        const relationship = RELATIONSHIPS[Math.floor(Math.random() * RELATIONSHIPS.length)];
        const dependentName = DEPENDENT_NAMES[Math.floor(Math.random() * DEPENDENT_NAMES.length)];
        await prisma.insuranceDependent.create({
          data: {
            insuranceInfoId: insuranceInfo.id,
            fullName: dependentName,
            relationship: relationship,
            gender: GENDERS[Math.floor(Math.random() * 2)],
            dateOfBirth: new Date(currentYear - 20 - Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            healthInsuranceNumber: generateHealthInsuranceNumber(),
            healthInsuranceStartDate: new Date(`${currentYear}-01-01`),
            healthInsuranceEndDate: new Date(`${currentYear}-12-31`),
            healthInsuranceHospital: hospitals[Math.floor(Math.random() * hospitals.length)],
            status: 'ACTIVE',
          },
        });
      }

      // Random: add claim (15% chance)
      if (Math.random() < 0.15) {
        const claimType = CLAIM_TYPES[Math.floor(Math.random() * CLAIM_TYPES.length)];
        const claimStatus = CLAIM_STATUSES[Math.floor(Math.random() * CLAIM_STATUSES.length)];
        const amount = Math.floor(Math.random() * 5000000) + 500000;
        await prisma.insuranceClaim.create({
          data: {
            insuranceInfoId: insuranceInfo.id,
            claimType: claimType,
            status: claimStatus,
            amount: amount,
            calculatedAmount: claimStatus === 'APPROVED' || claimStatus === 'PAID' ? amount : null,
            benefitDays: claimType === 'SICK_LEAVE' ? Math.floor(Math.random() * 10) + 1 : null,
            startDate: new Date(currentYear, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
            reason: claimType === 'SICK_LEAVE' ? 'Ốm đau thông thường' : (claimType === 'MATERNITY' ? 'Nghỉ thai sản' : 'Chi phí KCB'),
            hospitalName: hospitals[Math.floor(Math.random() * hospitals.length)],
            submittedAt: new Date(),
            ...(claimStatus !== 'PENDING' && { reviewedAt: new Date() }),
            ...(claimStatus === 'APPROVED' || claimStatus === 'PAID' ? { approvedAt: new Date(), documentNumber: `QD-BHXH-${currentYear}-${Math.floor(Math.random() * 1000)}` } : {}),
            ...(claimStatus === 'PAID' ? { paidAt: new Date(), paymentReference: `CT-${currentYear}-${Math.floor(Math.random() * 10000)}` } : {}),
          },
        });
      }

      createdInsurance++;
    }
  }
  console.log(`  ✔ Tạo mới ${createdInsurance} hồ sơ BHXH`);

  // Summary
  const [totalInsurance, totalContributions, totalDependents, totalClaims, totalFacilities] = await Promise.all([
    prisma.insuranceInfo.count(),
    prisma.insuranceHistory.count({ where: { transactionType: 'CONTRIBUTION' } }),
    prisma.insuranceDependent.count(),
    prisma.insuranceClaim.count(),
    prisma.medicalFacility.count(),
  ]);

  console.log('\n📊 Tổng kết:');
  console.log(`  - Hồ sơ BHXH: ${totalInsurance}`);
  console.log(`  - Bản ghi đóng góp: ${totalContributions}`);
  console.log(`  - Người phụ thuộc: ${totalDependents}`);
  console.log(`  - Yêu cầu chế độ: ${totalClaims}`);
  console.log(`  - Cơ sở KCB: ${totalFacilities}`);
  console.log('\n✅ Hoàn thành seed dữ liệu BHXH!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
