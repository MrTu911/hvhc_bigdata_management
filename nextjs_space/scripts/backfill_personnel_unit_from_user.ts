/**
 * Backfill đơn vị: chiếu `User.unitId` (nơi de-facto đang quản lý gán đơn vị qua trang
 * /dashboard/admin/units) sang `Personnel.unitId` (M02 master) cho dữ liệu cũ đã drift.
 *
 * Bối cảnh: trước đây gán/gỡ nhân sự chỉ ghi `User.unitId`, chưa đồng bộ Personnel. Sau khi
 * bật dual-write ở route assign-personnel, badge "Số cán bộ" đếm theo Personnel.unitId nên
 * cần backfill một lần để 94 user-unit hiện có phản ánh sang Personnel.
 *
 * Quy tắc: chỉ xét user có personnelId.
 *   - personnel.unitId == user.unitId  → bỏ qua (đã đồng bộ).
 *   - personnel.unitId IS NULL         → FILL: set = user.unitId (an toàn, không mất dữ liệu).
 *   - personnel.unitId != user.unitId  → XUNG ĐỘT: KHÔNG tự ghi đè. Thường do đơn vị trùng
 *     (vd Personnel trỏ Ban import B12-* còn User trỏ bản mã QĐ G11.40.*). Chỉ ghi đè khi
 *     truyền thêm --include-conflicts (sau khi đã rà tay).
 * Không đụng personnel không gắn user (giữ nguyên đơn vị hiện tại của họ).
 *
 * Idempotent. Mặc định DRY-RUN. `--apply` chỉ thực thi FILL. `--apply --include-conflicts`
 * thực thi cả ghi đè xung đột theo User.unitId.
 * Chạy: npx tsx --require dotenv/config scripts/backfill_personnel_unit_from_user.ts [--apply] [--include-conflicts]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const INCLUDE_CONFLICTS = process.argv.includes('--include-conflicts');

interface PlanItem {
  userId: string;
  personnelId: string;
  fromUnitId: string | null;
  toUnitId: string;
  kind: 'fill' | 'conflict';
}

async function main() {
  // User có đơn vị và có hồ sơ Personnel liên kết
  const users = await prisma.user.findMany({
    where: { unitId: { not: null }, personnelId: { not: null } },
    select: { id: true, unitId: true, personnelId: true },
  });

  const personnelIds = users.map((u) => u.personnelId!).filter(Boolean);
  const personnel = await prisma.personnel.findMany({
    where: { id: { in: personnelIds } },
    select: { id: true, unitId: true, deletedAt: true },
  });
  const personnelById = new Map(personnel.map((p) => [p.id, p]));

  const plan: PlanItem[] = [];
  for (const u of users) {
    const p = personnelById.get(u.personnelId!);
    if (!p) continue; // personnelId trỏ tới bản ghi không tồn tại — bỏ qua an toàn
    if (p.deletedAt) continue; // không backfill bản ghi đã xóa mềm
    if (p.unitId === u.unitId) continue; // đã đồng bộ
    plan.push({
      userId: u.id,
      personnelId: p.id,
      fromUnitId: p.unitId,
      toUnitId: u.unitId!,
      kind: p.unitId === null ? 'fill' : 'conflict',
    });
  }

  const fills = plan.filter((x) => x.kind === 'fill');
  const conflicts = plan.filter((x) => x.kind === 'conflict');

  console.log(`[backfill personnel.unitId] mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  users(unit+personnel) = ${users.length}`);
  console.log(`  cần điền (null→unit)   = ${fills.length}`);
  console.log(`  XUNG ĐỘT (khác unit)   = ${conflicts.length}`);

  if (conflicts.length > 0) {
    console.log('  --- Danh sách XUNG ĐỘT (personnel đang ở unit khác user — cần rà tay, KHÔNG tự ghi đè) ---');
    for (const c of conflicts) {
      console.log(`    personnelId=${c.personnelId} from=${c.fromUnitId} -> ${c.toUnitId} (userId=${c.userId})`);
    }
  }

  if (!APPLY) {
    console.log('  DRY-RUN: chưa ghi gì. Thêm --apply để điền 51 ca an toàn (FILL).');
    return;
  }

  // Mặc định chỉ ghi FILL (null → unit). Xung đột chỉ ghi đè khi bật --include-conflicts.
  const toWrite = INCLUDE_CONFLICTS ? plan : fills;
  let updated = 0;
  for (const item of toWrite) {
    await prisma.personnel.update({
      where: { id: item.personnelId },
      data: { unitId: item.toUnitId },
    });
    updated++;
  }
  console.log(`  ĐÃ GHI: cập nhật ${updated} personnel.unitId (${INCLUDE_CONFLICTS ? 'FILL + CONFLICT' : 'chỉ FILL'}).`);
  if (!INCLUDE_CONFLICTS && conflicts.length > 0) {
    console.log(`  Bỏ qua ${conflicts.length} xung đột. Rà tay rồi chạy lại với --apply --include-conflicts nếu muốn ghi đè theo User.unitId.`);
  }
}

main()
  .catch((e) => {
    console.error('[backfill personnel.unitId] LỖI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
