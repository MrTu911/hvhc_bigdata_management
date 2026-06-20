/**
 * audit_personnel_classification.ts (READ-ONLY)
 *
 * Đối chiếu phân loại SĨ QUAN/QUÂN NHÂN giữa:
 *   - LEGACY: dò từ khóa quân hàm trên User.rank ('tướng','tá','úy' vs 'sĩ','binh')
 *   - NEW:    nguồn sự thật là quan hệ Personnel.officerCareer / soldierProfile
 *             (qua User.personnelId), keyword chỉ là fallback.
 *
 * In ra số liệu tổng hợp + danh sách User bị LỆCH giữa hai cách (để xác minh
 * trước/sau khi đổi nguồn phân loại). Không ghi/sửa dữ liệu.
 *
 * Chạy: npx tsx --require dotenv/config scripts/audit_personnel_classification.ts
 */

import { PrismaClient } from '@prisma/client';
import { classifyPersonnelType } from '../lib/services/personnel/personnel-classification.service';

const prisma = new PrismaClient();

const OFFICER_RANK_KEYWORDS = ['tướng', 'tá', 'úy'];
const SOLDIER_RANK_KEYWORDS = ['sĩ', 'binh'];

type TypeClass = 'OFFICER' | 'SOLDIER' | 'CIVILIAN';

/** Cách cũ: chỉ dựa vào từ khóa quân hàm (sĩ quan ưu tiên). */
function classifyByKeyword(rank: string | null | undefined): TypeClass {
  const r = (rank ?? '').toLowerCase();
  if (OFFICER_RANK_KEYWORDS.some((k) => r.includes(k))) return 'OFFICER';
  if (SOLDIER_RANK_KEYWORDS.some((k) => r.includes(k))) return 'SOLDIER';
  return 'CIVILIAN';
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      rank: true,
      personnelProfile: {
        select: {
          officerCareer: { select: { id: true } },
          soldierProfile: { select: { id: true } },
        },
      },
    },
  });

  const tallyLegacy: Record<TypeClass, number> = { OFFICER: 0, SOLDIER: 0, CIVILIAN: 0 };
  const tallyNew: Record<TypeClass, number> = { OFFICER: 0, SOLDIER: 0, CIVILIAN: 0 };
  const mismatches: { id: string; name: string; rank: string | null; legacy: TypeClass; next: TypeClass }[] = [];

  for (const u of users) {
    const legacy = classifyByKeyword(u.rank);
    const next = classifyPersonnelType(u);
    tallyLegacy[legacy] += 1;
    tallyNew[next] += 1;
    if (legacy !== next) {
      mismatches.push({ id: u.id, name: u.name ?? '', rank: u.rank ?? null, legacy, next });
    }
  }

  console.log(`Tổng User: ${users.length}`);
  console.log('LEGACY (keyword):', tallyLegacy);
  console.log('NEW (relation-first):', tallyNew);
  console.log(`Số bản ghi LỆCH: ${mismatches.length}`);
  for (const m of mismatches.slice(0, 50)) {
    console.log(`  - ${m.name} | rank="${m.rank ?? ''}" | ${m.legacy} → ${m.next}`);
  }
  if (mismatches.length > 50) {
    console.log(`  ... và ${mismatches.length - 50} bản ghi khác`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
