/**
 * Backfill liên thông: chiếu trường mô tả nhân thân từ `User` (nơi ghi lịch sử) sang
 * `Personnel` (M02 master) cho dữ liệu đã drift. Dùng sau khi bật projection ở các đường
 * ghi (commitRequest, PUT /api/profile/me) để đồng bộ dữ liệu cũ.
 *
 * Mặc định DRY-RUN (chỉ đếm lệch). Ghi thật khi truyền --apply.
 * Chạy: npx tsx --require dotenv/config scripts/backfill_personnel_from_user.ts [--apply]
 */
import { PrismaClient } from '@prisma/client';
import { USER_TO_PERSONNEL_FIELD_MAP } from '../lib/constants/personnel-field-map';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const USER_KEYS = Object.keys(USER_TO_PERSONNEL_FIELD_MAP);

function normalize(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { personnelId: { not: null } },
    select: {
      id: true,
      personnelId: true,
      ...Object.fromEntries(USER_KEYS.map((k) => [k, true])),
    } as Record<string, true>,
  });

  let scanned = 0;
  let drifted = 0;
  let applied = 0;
  const driftByField: Record<string, number> = {};

  for (const user of users as Array<Record<string, unknown>>) {
    scanned++;
    const personnelId = user.personnelId as string;
    const personnel = await prisma.personnel.findUnique({
      where: { id: personnelId },
      select: Object.fromEntries(
        Object.values(USER_TO_PERSONNEL_FIELD_MAP).map((k) => [k, true]),
      ) as Record<string, true>,
    });
    if (!personnel) continue;

    const patch: Record<string, unknown> = {};
    for (const [userKey, personnelKey] of Object.entries(USER_TO_PERSONNEL_FIELD_MAP)) {
      const uVal = user[userKey];
      const pVal = (personnel as Record<string, unknown>)[personnelKey];
      // Chỉ chiếu khi User có giá trị và khác Personnel (không ghi đè bằng null).
      if (uVal !== null && uVal !== undefined && uVal !== '' && normalize(uVal) !== normalize(pVal)) {
        patch[personnelKey] = uVal;
        driftByField[personnelKey] = (driftByField[personnelKey] ?? 0) + 1;
      }
    }

    if (Object.keys(patch).length > 0) {
      drifted++;
      if (APPLY) {
        await prisma.personnel.update({ where: { id: personnelId }, data: patch });
        applied++;
      }
    }
  }

  console.log(`[backfill] mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`[backfill] users(có personnelId) quét: ${scanned}`);
  console.log(`[backfill] bản ghi lệch cần đồng bộ: ${drifted}`);
  console.log(`[backfill] đã ghi Personnel: ${applied}`);
  console.log(`[backfill] lệch theo trường:`, driftByField);
  if (!APPLY && drifted > 0) console.log('[backfill] Chạy lại với --apply để ghi.');
}

main()
  .catch((e) => {
    console.error('[backfill] lỗi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
