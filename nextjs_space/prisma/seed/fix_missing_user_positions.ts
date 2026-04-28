/**
 * fix_missing_user_positions.ts
 *
 * Tạo UserPosition cho tất cả users đang có role nhưng KHÔNG có UserPosition.
 * Đây là nguyên nhân users không lấy được quyền từ RBAC matrix.
 *
 * Chạy: npx tsx prisma/seed/fix_missing_user_positions.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Map legacy role → position code trong DB
const ROLE_TO_POSITION: Record<string, string> = {
  GIANG_VIEN:          'GIANG_VIEN',
  NGHIEN_CUU_VIEN:     'NGHIEN_CUU_VIEN',
  CHU_NHIEM_BO_MON:    'CHU_NHIEM_BO_MON',
  CHI_HUY_HE:          'CHI_HUY_HE',
  CHI_HUY_TIEU_DOAN:   'CHI_HUY_TIEU_DOAN',
  CHI_HUY_BAN:         'CHI_HUY_BAN',
  CHI_HUY_KHOA_PHONG:  'TRUONG_KHOA',        // Chỉ huy Khoa/Phòng → TRUONG_KHOA
  CHI_HUY_HOC_VIEN:    'PHO_GIAM_DOC',       // Chỉ huy Học viện → PHO_GIAM_DOC
  HOC_VIEN_SINH_VIEN:  'HOC_VIEN',           // Legacy → HOC_VIEN
  HOC_VIEN:            'HOC_VIEN_QUAN_SU',
  KY_THUAT_VIEN:       'KY_THUAT_VIEN',
  NHAN_VIEN:           'NHAN_VIEN',
  QUAN_TRI_HE_THONG:   'SYSTEM_ADMIN',
  ADMIN:               'SYSTEM_ADMIN',
};

async function main() {
  // 1. Lấy tất cả users không có UserPosition active
  const usersWithoutPosition = await prisma.user.findMany({
    where: { userPositions: { none: { isActive: true } } },
    select: { id: true, email: true, role: true, unitId: true },
    orderBy: { email: 'asc' },
  });

  console.log(`Tìm thấy ${usersWithoutPosition.length} users không có UserPosition\n`);

  if (usersWithoutPosition.length === 0) {
    console.log('Không cần fix gì.');
    return;
  }

  // 2. Load tất cả positions một lần
  const positions = await prisma.position.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
  });
  const positionByCode = new Map(positions.map(p => [p.code, p]));

  let created = 0;
  let skipped = 0;

  for (const user of usersWithoutPosition) {
    const role = user.role || '';
    const positionCode = ROLE_TO_POSITION[role];

    if (!positionCode) {
      console.log(`SKIP ${user.email} — role='${role}' không có mapping`);
      skipped++;
      continue;
    }

    const position = positionByCode.get(positionCode);
    if (!position) {
      console.log(`SKIP ${user.email} — position '${positionCode}' không tìm thấy trong DB`);
      skipped++;
      continue;
    }

    // Tạo UserPosition
    await prisma.userPosition.create({
      data: {
        userId:    user.id,
        positionId: position.id,
        unitId:    user.unitId,   // Dùng User.unitId làm unit mặc định
        isPrimary: true,
        isActive:  true,
        startDate: new Date(),
      },
    });

    console.log(`OK ${user.email} → ${position.code} (${position.name})`);
    created++;
  }

  console.log(`\nXong: ${created} tạo mới, ${skipped} bỏ qua`);
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
