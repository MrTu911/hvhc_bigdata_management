/**
 * Seed: Liên kết HocVien ↔ Users + gán CohortId/ClassId
 * -------------------------------------------------------
 * Mục đích:
 *  1. Gán userId cho 50 học viên đầu tiên (khớp với 50 tài khoản HOC_VIEN)
 *  2. Gán cohortId + classId cho toàn bộ 120 hoc_vien dựa trên lop/khoaHoc
 *
 * Mapping lop → student_class:
 *   Khóa 2022: HC24A→K61A, HC25A→K61B, QN25→K61C
 *   Khóa 2023: HC24B→K62A, HC25B→K62B, VT25→K62C
 *   Khóa 2024: HC26A→K63A, QN24→K63B, XD25→K63C
 *   Khóa 2025: HC26B→K64A, TC25→K64B, VT24→K64C
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_link_hocvien_users.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// --- IDs từ DB (student_classes + cohorts) ---
const CLASS_MAP: Record<string, { classId: string; cohortId: string }> = {
  HC24A: { classId: 'cmmuk8tsn004s8ipko2g0zw2m', cohortId: 'cmmuk8tsg004m8ipk4ypc50n7' }, // K61A
  HC25A: { classId: 'cmmuk8tsp004u8ipkde1iafwl', cohortId: 'cmmuk8tsg004m8ipk4ypc50n7' }, // K61B
  QN25:  { classId: 'cmmuk8tsr004w8ipknqxkzbb3', cohortId: 'cmmuk8tsg004m8ipk4ypc50n7' }, // K61C
  HC24B: { classId: 'cmmuk8tss004y8ipk67lz0dfw', cohortId: 'cmmuk8tsh004n8ipkioah994n' }, // K62A
  HC25B: { classId: 'cmmuk8tst00508ipk0qpsyad1', cohortId: 'cmmuk8tsh004n8ipkioah994n' }, // K62B
  VT25:  { classId: 'cmmuk8tsu00528ipkgnajodnt', cohortId: 'cmmuk8tsh004n8ipkioah994n' }, // K62C
  HC26A: { classId: 'cmmuk8tsw00548ipkvvuon0sf', cohortId: 'cmmuk8tsh004o8ipkdb3m5e57' }, // K63A
  QN24:  { classId: 'cmmuk8tsx00568ipk772j9eq6', cohortId: 'cmmuk8tsh004o8ipkdb3m5e57' }, // K63B
  XD25:  { classId: 'cmmuk8tsz00588ipkv932culp', cohortId: 'cmmuk8tsh004o8ipkdb3m5e57' }, // K63C
  HC26B: { classId: 'cmmuk8tt0005a8ipkfl8tb05w', cohortId: 'cmmuk8tsi004p8ipkef5ui20h' }, // K64A
  TC25:  { classId: 'cmmuk8tt1005c8ipktyv2c8yq', cohortId: 'cmmuk8tsi004p8ipkef5ui20h' }, // K64B
  VT24:  { classId: 'cmmuk8tt2005e8ipkjmr9zv9d', cohortId: 'cmmuk8tsi004p8ipkef5ui20h' }, // K64C
};

async function main() {
  console.log('=== Seed: Liên kết HocVien ↔ Users ===\n');

  // ── 1. Lấy toàn bộ hoc_vien, sắp xếp theo maHocVien ──────────────────
  const allHocVien = await prisma.hocVien.findMany({
    orderBy: { maHocVien: 'asc' },
    select: { id: true, maHocVien: true, hoTen: true, lop: true, userId: true },
  });
  console.log(`Tổng hoc_vien: ${allHocVien.length}`);

  // ── 2. Lấy 50 tài khoản HOC_VIEN, sắp xếp theo tên ───────────────────
  const hvUsers = await prisma.user.findMany({
    where: { role: 'HOC_VIEN' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  console.log(`Tài khoản HOC_VIEN: ${hvUsers.length}`);

  if (hvUsers.length === 0) {
    console.error('Không tìm thấy tài khoản HOC_VIEN!');
    return;
  }

  // ── 3. Gán cohortId + classId cho tất cả hoc_vien ─────────────────────
  let cohortUpdated = 0;
  for (const hv of allHocVien) {
    const mapping = CLASS_MAP[hv.lop ?? ''];
    if (mapping) {
      await prisma.hocVien.update({
        where: { id: hv.id },
        data: {
          cohortId: mapping.cohortId,
          classId: mapping.classId,
        },
      });
      cohortUpdated++;
    }
  }
  console.log(`✓ Đã gán cohortId/classId cho ${cohortUpdated}/${allHocVien.length} học viên`);

  // ── 4. Gán userId cho 50 hoc_vien đầu tiên ────────────────────────────
  // Ưu tiên những hoc_vien chưa có userId
  const hvWithoutUser = allHocVien.filter(hv => !hv.userId).slice(0, hvUsers.length);
  let userLinked = 0;

  for (let i = 0; i < hvWithoutUser.length && i < hvUsers.length; i++) {
    const hv = hvWithoutUser[i];
    const user = hvUsers[i];

    await prisma.hocVien.update({
      where: { id: hv.id },
      data: { userId: user.id },
    });
    userLinked++;
    console.log(`  ✓ ${hv.maHocVien} (${hv.hoTen}) → ${user.name} [${user.id.slice(-8)}]`);
  }

  console.log(`\n✓ Đã liên kết ${userLinked} học viên với tài khoản hệ thống`);

  // ── 5. Kiểm tra kết quả ────────────────────────────────────────────────
  const [withUser, withCohort, withClass] = await Promise.all([
    prisma.hocVien.count({ where: { userId: { not: null } } }),
    prisma.hocVien.count({ where: { cohortId: { not: null } } }),
    prisma.hocVien.count({ where: { classId: { not: null } } }),
  ]);

  console.log('\n=== Kết quả sau seed ===');
  console.log(`  hoc_vien có userId:    ${withUser}/${allHocVien.length}`);
  console.log(`  hoc_vien có cohortId:  ${withCohort}/${allHocVien.length}`);
  console.log(`  hoc_vien có classId:   ${withClass}/${allHocVien.length}`);
  console.log('\nHoàn thành!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
