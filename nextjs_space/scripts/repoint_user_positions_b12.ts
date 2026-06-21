/**
 * Repoint user_positions từ các Ban B12-* trùng (đã deactivated) sang đơn vị canonical.
 *
 * Bối cảnh: Viện B12 từng có 2 bộ Ban trùng — bản import cũ (B12-KHHC/KHKT/KHTH, đã inactive)
 * và bản chuẩn theo mã QĐ-3843 (G11.40.009.001/003, B12_VQLT, đang active). Personnel đã được
 * chuyển sang bản chuẩn (backfill trước đó). Còn 29 `user_positions` (gán chức vụ RBAC) vẫn trỏ
 * Ban inactive → scope RBAC trỏ đơn vị chết. Script này chuyển chúng sang đơn vị canonical.
 *
 * Ánh xạ (theo Unit.code, resolve ID lúc chạy cho an toàn):
 *   B12-KHHC (Ban Khoa học hậu cần)      → G11.40.009.001 (Ban Khoa học)
 *   B12-KHKT (Ban Khoa học kỹ thuật)     → G11.40.009.003 (Ban Kỹ thuật)
 *   B12-KHTH (Ban Kế hoạch tổng hợp)     → B12_VQLT       (Ban Kế hoạch)
 *
 * `UserPosition` KHÔNG có @@unique → repoint không vi phạm ràng buộc (đã kiểm chứng collision=0).
 * Idempotent (chạy lại không còn gì để chuyển). Mặc định DRY-RUN, ghi thật khi --apply.
 * Chạy: npx tsx --require dotenv/config scripts/repoint_user_positions_b12.ts [--apply]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const CODE_MAP: Record<string, string> = {
  'B12-KHHC': 'G11.40.009.001',
  'B12-KHKT': 'G11.40.009.003',
  'B12-KHTH': 'B12_VQLT',
};

async function main() {
  // Resolve code → id cho cả nguồn và đích
  const codes = [...Object.keys(CODE_MAP), ...Object.values(CODE_MAP)];
  const units = await prisma.unit.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true },
  });
  const idByCode = new Map(units.map((u) => [u.code, u.id]));

  const missing = codes.filter((c) => !idByCode.has(c));
  if (missing.length > 0) {
    console.error('[repoint] Thiếu unit cho code:', missing.join(', '), '— dừng.');
    process.exit(1);
  }

  const srcToDstId = new Map<string, string>();
  for (const [srcCode, dstCode] of Object.entries(CODE_MAP)) {
    srcToDstId.set(idByCode.get(srcCode)!, idByCode.get(dstCode)!);
  }

  console.log(`[repoint user_positions B12-*] mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);

  let total = 0;
  for (const [srcCode, dstCode] of Object.entries(CODE_MAP)) {
    const srcId = idByCode.get(srcCode)!;
    const dstId = idByCode.get(dstCode)!;
    const count = await prisma.userPosition.count({ where: { unitId: srcId, isActive: true } });
    total += count;
    console.log(`  ${srcCode} → ${dstCode}: ${count} user_positions`);

    if (APPLY && count > 0) {
      const res = await prisma.userPosition.updateMany({
        where: { unitId: srcId, isActive: true },
        data: { unitId: dstId },
      });
      console.log(`    ĐÃ CHUYỂN ${res.count}`);
    }
  }

  console.log(`  Tổng ${total} user_positions ${APPLY ? 'đã chuyển.' : 'sẽ chuyển (thêm --apply).'}`);
}

main()
  .catch((e) => {
    console.error('[repoint] LỖI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
