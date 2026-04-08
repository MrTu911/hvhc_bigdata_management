/**
 * Seed OfficerCareer & OfficerPromotion
 * Run: npx tsx --require dotenv/config prisma/seed/seed_officer_careers.ts
 */

import { PrismaClient, OfficerRank, PromotionType } from '@prisma/client';

const prisma = new PrismaClient();

// Map string militaryRank → OfficerRank enum
const RANK_MAP: Record<string, OfficerRank> = {
  'Đại tướng':   OfficerRank.DAI_TUONG,
  'Thượng tướng': OfficerRank.THUONG_TUONG,
  'Trung tướng': OfficerRank.TRUNG_TUONG,
  'Thiếu tướng': OfficerRank.THIEU_TUONG,
  'Đại tá':      OfficerRank.DAI_TA,
  'Thượng tá':   OfficerRank.THUONG_TA,
  'Trung tá':    OfficerRank.TRUNG_TA,
  'Thiếu tá':    OfficerRank.THIEU_TA,
  'Đại úy':      OfficerRank.DAI_UY,
  'Thượng úy':   OfficerRank.THUONG_UY,
  'Trung úy':    OfficerRank.TRUNG_UY,
  'Thiếu úy':    OfficerRank.THIEU_UY,
};

// Promotion type pool
const PROMO_TYPES: PromotionType[] = [
  PromotionType.THANG_CAP,
  PromotionType.BO_NHIEM,
  PromotionType.DIEU_DONG,
  PromotionType.LUAN_CHUYEN,
];

// Previous rank (one step below)
const PREV_RANK: Record<OfficerRank, OfficerRank | null> = {
  DAI_TUONG:    OfficerRank.THUONG_TUONG,
  THUONG_TUONG: OfficerRank.TRUNG_TUONG,
  TRUNG_TUONG:  OfficerRank.THIEU_TUONG,
  THIEU_TUONG:  OfficerRank.DAI_TA,
  DAI_TA:       OfficerRank.THUONG_TA,
  THUONG_TA:    OfficerRank.TRUNG_TA,
  TRUNG_TA:     OfficerRank.THIEU_TA,
  THIEU_TA:     OfficerRank.DAI_UY,
  DAI_UY:       OfficerRank.THUONG_UY,
  THUONG_UY:    OfficerRank.TRUNG_UY,
  TRUNG_UY:     OfficerRank.THIEU_UY,
  THIEU_UY:     null,
};

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🪖 Seeding OfficerCareer data...');

  // Get all CAN_BO_CHI_HUY personnel
  const personnel = await prisma.personnel.findMany({
    where: { category: 'CAN_BO_CHI_HUY' },
    select: { id: true, fullName: true, personnelCode: true, militaryRank: true, position: true },
  });

  console.log(`Found ${personnel.length} officers to seed`);

  let created = 0;
  let skipped = 0;
  const officerCareers: string[] = []; // ids for promotions

  for (let i = 0; i < personnel.length; i++) {
    const p = personnel[i];
    const rank = p.militaryRank ? RANK_MAP[p.militaryRank] : null;

    // Check existing
    const existing = await prisma.officerCareer.findUnique({ where: { personnelId: p.id } });
    if (existing) {
      skipped++;
      officerCareers.push(existing.id);
      continue;
    }

    // officerIdNumber: unique SQ-XXXXX
    const officerIdNumber = `SQ-${String(100000 + i).substring(1)}`;

    const commissionedYear = 1990 + Math.floor(Math.random() * 25);
    const commissionedDate = new Date(`${commissionedYear}-06-01`);

    const lastEvalDate = randomDate(new Date('2023-01-01'), new Date('2025-12-31'));
    const evalResults = ['Xuất sắc', 'Tốt', 'Khá', 'Hoàn thành nhiệm vụ'];
    const lastEvalResult = pick(evalResults);

    const career = await prisma.officerCareer.create({
      data: {
        personnelId: p.id,
        officerIdNumber,
        currentRank: rank ?? undefined,
        currentPosition: p.position ?? undefined,
        commissionedDate,
        lastEvaluationDate: lastEvalDate,
        lastEvaluationResult: lastEvalResult,
      },
    });

    officerCareers.push(career.id);
    created++;
  }

  console.log(`✅ OfficerCareer: created=${created}, skipped=${skipped}`);

  // Seed promotions (1-3 per officer for ~60% of officers)
  console.log('📈 Seeding OfficerPromotion data...');
  let promoCreated = 0;

  for (const careerId of officerCareers) {
    if (Math.random() > 0.65) continue; // seed ~65%

    const career = await prisma.officerCareer.findUnique({
      where: { id: careerId },
      select: { currentRank: true, currentPosition: true },
    });

    if (!career) continue;

    const numPromos = Math.floor(Math.random() * 3) + 1; // 1-3

    for (let j = 0; j < numPromos; j++) {
      const promoType = pick(PROMO_TYPES);
      const yearsAgo = numPromos - j;
      const effectiveDate = new Date();
      effectiveDate.setFullYear(effectiveDate.getFullYear() - yearsAgo);
      effectiveDate.setMonth(Math.floor(Math.random() * 12));

      const newRank = career.currentRank ?? undefined;
      const prevRank = newRank ? (PREV_RANK[newRank] ?? undefined) : undefined;

      const decisionNumber = `QĐ-${Math.floor(1000 + Math.random() * 9000)}/${effectiveDate.getFullYear()}`;

      // Avoid duplicate (no unique constraint, just check count reasonably)
      await prisma.officerPromotion.create({
        data: {
          officerCareerId: careerId,
          promotionType: promoType,
          effectiveDate,
          decisionNumber,
          decisionDate: new Date(effectiveDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          previousRank: prevRank,
          newRank: newRank,
          newPosition: career.currentPosition ?? undefined,
          reason: promoType === PromotionType.THANG_CAP
            ? 'Hoàn thành xuất sắc nhiệm vụ được giao'
            : promoType === PromotionType.BO_NHIEM
            ? 'Đáp ứng yêu cầu nhiệm vụ của đơn vị'
            : 'Theo yêu cầu công tác',
        },
      });
      promoCreated++;
    }
  }

  console.log(`✅ OfficerPromotion: created=${promoCreated}`);
  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
