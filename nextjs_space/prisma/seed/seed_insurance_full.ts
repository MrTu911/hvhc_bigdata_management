import {
  PrismaClient,
  InsuranceTransactionType,
  InsuranceClaimStatus,
  InsuranceClaimType,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

/* ================= CONFIG ================= */

const SEED_YEAR = 2025;
const BASE_SALARY = 1_800_000;

const EMPLOYEE_RATE = 0.105;
const EMPLOYER_RATE = 0.215;

/* ================= DATA ================= */

const RANK_COEFFICIENTS: Record<string, number> = {
  'Đại tá': 8.0,
  'Thượng tá': 7.3,
  'Trung tá': 6.6,
  'Thiếu tá': 6.0,
  'Đại úy': 5.4,
  'Thượng úy': 4.8,
  'Trung úy': 4.2,
  'Thiếu úy': 3.6,
};

const HOSPITALS = [
  'Bệnh viện 108',
  'Bệnh viện 103',
  'Bệnh viện 175',
  'Bệnh viện Bạch Mai',
];

/* ================= UTILS ================= */

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[rand(0, arr.length - 1)];
}

function genInsuranceNumber() {
  return `BHXH-${rand(100000, 999999)}`;
}

function genBHYT() {
  return `BHYT-${rand(100000, 999999)}`;
}

function calcSalary(rank?: string | null) {
  const coef = RANK_COEFFICIENTS[rank || 'Trung úy'] || 4;
  const base = Math.round(BASE_SALARY * coef);

  return {
    baseSalary: base,
    employee: Math.round(base * EMPLOYEE_RATE),
    employer: Math.round(base * EMPLOYER_RATE),
    total: Math.round(base * (EMPLOYEE_RATE + EMPLOYER_RATE)),
  };
}

/* ================= MAIN ================= */

async function main() {
  console.time('SEED_INSURANCE');

  console.log('🏥 Seeding Insurance FULL...');

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, rank: true },
  });

  if (users.length === 0) {
    throw new Error('Không có user');
  }

  /* ================= 1. INSURANCE INFO ================= */

  const existingInfos = await prisma.insuranceInfo.findMany({
    select: { userId: true },
  });

  const existingMap = new Set(existingInfos.map((i) => i.userId));

  const createInfos = users
    .filter((u) => !existingMap.has(u.id))
    .map((u) => ({
      userId: u.id,
      insuranceNumber: genInsuranceNumber(),
      insuranceStartDate: new Date(`${SEED_YEAR - rand(1, 10)}-01-01`),
      healthInsuranceNumber: genBHYT(),
      healthInsuranceStartDate: new Date(`${SEED_YEAR}-01-01`),
      healthInsuranceEndDate: new Date(`${SEED_YEAR}-12-31`),
      healthInsuranceHospital: pick(HOSPITALS),
      beneficiaryName: 'Nguyễn Văn A',
      beneficiaryRelation: 'Vợ',
      beneficiaryPhone: '0900000000',
    }));

  if (createInfos.length > 0) {
    await prisma.insuranceInfo.createMany({
      data: createInfos,
      skipDuplicates: true,
    });
  }

  console.log(`✔ InsuranceInfo created: ${createInfos.length}`);

  const infos = await prisma.insuranceInfo.findMany({
    select: { id: true, userId: true },
  });

  const infoMap = new Map(infos.map((i) => [i.userId, i.id]));

  /* ================= 2. CONTRIBUTIONS ================= */

  const existingHistory = await prisma.insuranceHistory.findMany({
    where: {
      periodYear: SEED_YEAR,
      transactionType: InsuranceTransactionType.CONTRIBUTION,
    },
    select: {
      insuranceInfoId: true,
      periodMonth: true,
    },
  });

  const historyKey = new Set(
    existingHistory.map((h) => `${h.insuranceInfoId}-${h.periodMonth}`),
  );

  const contributions: any[] = [];

  for (const user of users) {
    const infoId = infoMap.get(user.id);
    if (!infoId) continue;

    const salary = calcSalary(user.rank);

    for (let m = 1; m <= 12; m++) {
      const key = `${infoId}-${m}`;
      if (historyKey.has(key)) continue;

      contributions.push({
        insuranceInfoId: infoId,
        transactionType: InsuranceTransactionType.CONTRIBUTION,
        periodMonth: m,
        periodYear: SEED_YEAR,
        baseSalary: salary.baseSalary,
        amount: salary.total,
        employeeShare: salary.employee,
        employerShare: salary.employer,
      });
    }
  }

  if (contributions.length > 0) {
    await prisma.insuranceHistory.createMany({
      data: contributions,
      skipDuplicates: true,
    });
  }

  console.log(`✔ Contributions: ${contributions.length}`);

  /* ================= 3. DEPENDENTS ================= */

  const dependents: any[] = [];

  for (const info of infos) {
    if (Math.random() < 0.5) {
      dependents.push({
        insuranceInfoId: info.id,
        fullName: 'Nguyễn Thị B',
        relationship: 'SPOUSE',
        gender: 'Nữ',
        dateOfBirth: new Date('1990-01-01'),
        healthInsuranceNumber: genBHYT(),
        healthInsuranceStartDate: new Date(`${SEED_YEAR}-01-01`),
        healthInsuranceEndDate: new Date(`${SEED_YEAR}-12-31`),
        healthInsuranceHospital: pick(HOSPITALS),
        status: 'ACTIVE',
      });
    }
  }

  if (dependents.length > 0) {
    await prisma.insuranceDependent.createMany({
      data: dependents,
      skipDuplicates: true,
    });
  }

  console.log(`✔ Dependents: ${dependents.length}`);

  /* ================= 4. CLAIMS ================= */

  const claims: any[] = [];

  for (const info of infos) {
    if (Math.random() < 0.25) {
      const status = pick([
        InsuranceClaimStatus.PENDING,
        InsuranceClaimStatus.APPROVED,
        InsuranceClaimStatus.REJECTED,
      ]);

      claims.push({
        insuranceInfoId: info.id,
        claimType: InsuranceClaimType.SICK_LEAVE,
        status,
        amount: rand(500000, 5000000),
        startDate: new Date(),
        reason: 'Ốm đau',
        hospitalName: pick(HOSPITALS),
        submittedAt: new Date(),
      });
    }
  }

  if (claims.length > 0) {
    await prisma.insuranceClaim.createMany({
      data: claims,
      skipDuplicates: true,
    });
  }

  console.log(`✔ Claims: ${claims.length}`);

  /* ================= SUMMARY ================= */

  const total = await prisma.insuranceInfo.count();

  console.log('\n📊 RESULT');
  console.log(`Insurance: ${total}`);
  console.log('✅ DONE\n');

  console.timeEnd('SEED_INSURANCE');
}

/* ================= RUN ================= */

main()
  .catch((e) => {
    console.error('❌ ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());