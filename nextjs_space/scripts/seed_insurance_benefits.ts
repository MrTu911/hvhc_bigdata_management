/**
 * Seed Insurance Benefits (Quyen loi BHXH)
 * Tao du lieu huong BHXH (om dau, thai san, etc.)
 */
import { PrismaClient, InsuranceBenefitType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const BENEFIT_TYPES: InsuranceBenefitType[] = [
  'SICK_LEAVE',
  'MATERNITY',
  'RETIREMENT',
  'DEATH',
  'OCCUPATIONAL',
  'UNEMPLOYMENT',
  'OTHER'
];

const BENEFIT_REASONS: Record<InsuranceBenefitType, string[]> = {
  SICK_LEAVE: [
    'Nghỉ ốm điều trị nội trú',
    'Nghỉ ốm điều trị ngoại trú', 
    'Nghỉ ốm theo giấy nghỉ việc hưởng BHXH',
    'Nghỉ ốm do bệnh dài ngày'
  ],
  MATERNITY: [
    'Nghỉ sinh con',
    'Nghỉ khám thai',
    'Nghỉ do sảy thai',
    'Nghỉ nhận con nuôi dưới 6 tháng tuổi'
  ],
  RETIREMENT: [
    'Nghỉ hưu trước tuổi',
    'Nghỉ hưu đủ tuổi',
    'Nghỉ hưu do suy giảm khả năng lao động'
  ],
  DEATH: [
    'Tử tuất - hỗ trợ mai táng',
    'Trợ cấp tuất một lần',
    'Trợ cấp tuất hàng tháng'
  ],
  OCCUPATIONAL: [
    'Tai nạn lao động khi làm việc',
    'Bệnh nghề nghiệp do tiếp xúc hóa chất',
    'Tai nạn trên đường đi công tác'
  ],
  UNEMPLOYMENT: [
    'Thất nghiệp do chấm dứt hợp đồng',
    'Thất nghiệp do giảm biên chế'
  ],
  OTHER: [
    'Hỗ trợ đặc biệt',
    'Trợ cấp đột xuất'
  ]
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateBenefitAmount(type: InsuranceBenefitType, baseSalary: number, days: number): number {
  switch (type) {
    case 'SICK_LEAVE':
      // 75% luong/ngay x so ngay
      return Math.round((baseSalary / 26) * days * 0.75);
    case 'MATERNITY':
      // 100% luong x 6 thang
      return Math.round(baseSalary * 6);
    case 'RETIREMENT':
      // Mot lan 2 thang luong/nam dong
      return Math.round(baseSalary * randomInt(24, 60));
    case 'DEATH':
      // Tro cap mai tang + tuat mot lan
      return Math.round(baseSalary * randomInt(10, 36));
    case 'OCCUPATIONAL':
      // Tuy theo muc thuong tat
      return Math.round(baseSalary * randomInt(6, 36));
    case 'UNEMPLOYMENT':
      // 60% luong x so thang
      return Math.round(baseSalary * 0.6 * randomInt(3, 12));
    default:
      return Math.round(baseSalary * randomInt(1, 3));
  }
}

async function main() {
  console.log('Starting seed insurance benefits...');

  try {
    // Get insurance infos with user details
    const insuranceInfos = await prisma.insuranceInfo.findMany({
      take: 50, // Seed 50 benefit records
      include: {
        user: {
          select: {
            name: true,
            rank: true
          }
        }
      }
    });

    console.log(`Found ${insuranceInfos.length} insurance infos`);

    const RANK_SALARY: Record<string, number> = {
      'Đại tướng': 18720000,
      'Thượng tướng': 17640000,
      'Trung tướng': 16560000,
      'Thiếu tướng': 15480000,
      'Đại tá': 14400000,
      'Thượng tá': 13140000,
      'Trung tá': 11880000,
      'Thiếu tá': 10800000,
      'Đại úy': 9720000,
      'Thượng úy': 8640000,
      'Trung úy': 7560000,
      'Thiếu úy': 6480000,
      'Thượng sĩ': 5760000,
      'Trung sĩ': 5040000,
      'Hạ sĩ': 4320000,
      'Binh nhất': 3600000,
      'Binh nhì': 3240000,
    };

    let created = 0;

    for (const info of insuranceInfos) {
      // Random 1-3 benefit records per person
      const numBenefits = randomInt(1, 3);

      for (let i = 0; i < numBenefits; i++) {
        const benefitType = randomItem(BENEFIT_TYPES);
        const reasons = BENEFIT_REASONS[benefitType];
        const baseSalary = RANK_SALARY[info.user?.rank || 'Trung úy'] || 7560000;
        const benefitDays = randomInt(5, 30);
        const amount = calculateBenefitAmount(benefitType, baseSalary, benefitDays);

        // Random date in 2025-2026
        const year = randomInt(2025, 2026);
        const month = randomInt(1, 12);

        await prisma.insuranceHistory.create({
          data: {
            insuranceInfoId: info.id,
            transactionType: 'BENEFIT',
            periodMonth: month,
            periodYear: year,
            baseSalary: baseSalary,
            amount: amount,
            benefitType: benefitType,
            benefitReason: randomItem(reasons),
            benefitPeriod: benefitDays,
            documentNumber: `QĐ-BHXH-${year}-${String(created + 1).padStart(4, '0')}`,
            documentDate: new Date(year, month - 1, randomInt(1, 28)),
            notes: `Đã duyệt chi trả quyền lợi ${benefitType}`
          }
        });

        created++;
      }
    }

    console.log(`Created ${created} benefit records`);

    // Verify
    const total = await prisma.insuranceHistory.count({
      where: { transactionType: 'BENEFIT' }
    });
    console.log(`Total BENEFIT records in database: ${total}`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
