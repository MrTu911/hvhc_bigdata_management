/**
 * Backfill đơn vị cho giảng viên: chiếu `User.unitId` → `FacultyProfile.unitId` cho dữ liệu cũ.
 *
 * Bối cảnh: FacultyProfile.unitId trước đây không được đồng bộ (213 giảng viên đều NULL).
 * Service `projectUnitMembership` từ nay đồng bộ khi gán qua trang đơn vị, nhưng giảng viên cũ
 * cần backfill. Chỉ ~42 giảng viên có nguồn (User.unitId đã có); số còn lại gán tay qua UI.
 *
 * FacultyProfile liên kết người qua `userId` (@unique). User.unitId đã được hòa hợp với
 * Personnel.unitId ở đợt trước (conflicts=0), nên đây chỉ điền nốt cột thứ 3.
 *
 * Idempotent. Mặc định DRY-RUN, ghi thật khi --apply.
 * Chạy: npx tsx --require dotenv/config scripts/backfill_faculty_unit_from_user.ts [--apply]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  // Giảng viên có tài khoản User mang unitId, nhưng FacultyProfile chưa đồng bộ
  const faculties = await prisma.facultyProfile.findMany({
    where: { user: { unitId: { not: null } } },
    select: { id: true, unitId: true, user: { select: { unitId: true } } },
  });

  const toFix = faculties.filter((f) => f.unitId !== f.user.unitId);

  console.log(`[backfill faculty.unitId] mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  giảng viên có User.unitId = ${faculties.length}`);
  console.log(`  cần đồng bộ (faculty.unitId != user.unitId) = ${toFix.length}`);

  if (!APPLY) {
    console.log('  DRY-RUN: chưa ghi gì. Thêm --apply để thực thi.');
    return;
  }

  let updated = 0;
  for (const f of toFix) {
    await prisma.facultyProfile.update({
      where: { id: f.id },
      data: { unitId: f.user.unitId },
    });
    updated++;
  }
  console.log(`  ĐÃ GHI: cập nhật ${updated} faculty_profiles.unitId.`);
}

main()
  .catch((e) => {
    console.error('[backfill faculty.unitId] LỖI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
