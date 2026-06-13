/**
 * Backfill: PartyMember.partyCell/partyCommittee (legacy free-text)
 *           → PartyMember.organizationId (quan hệ chuẩn PartyOrganization)
 *
 * Chiến lược (migration-refactor rules): Expand → Backfill → Contract.
 * - Đây là bước Backfill: chỉ gán organizationId cho member đang null mà có
 *   partyCell/partyCommittee khớp CHÍNH XÁC (đã chuẩn hoá) với 1 PartyOrganization.
 * - KHÔNG xoá cột legacy (giữ để rollback/đối chiếu). KHÔNG ghi đè organizationId
 *   đã có. Trường hợp mơ hồ (khớp nhiều) hoặc không khớp → chỉ báo cáo.
 *
 * Mặc định chạy DRY-RUN (không ghi DB). Thêm cờ --apply để ghi thật.
 *
 * Usage:
 *   npx tsx --require dotenv/config scripts/backfill/backfill-party-org-from-cell.ts
 *   npx tsx --require dotenv/config scripts/backfill/backfill-party-org-from-cell.ts --apply
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

/** Chuẩn hoá để so khớp: bỏ dấu cách thừa, lowercase. */
function normalize(value?: string | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

interface OrgIndex {
  byCode: Map<string, string[]>; // normalized code → orgIds
  byName: Map<string, string[]>; // normalized name → orgIds
  byShortName: Map<string, string[]>; // normalized shortName → orgIds
  nameById: Map<string, string>;
}

function buildOrgIndex(
  orgs: Array<{ id: string; code: string; name: string; shortName: string | null }>,
): OrgIndex {
  const byCode = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  const byShortName = new Map<string, string[]>();
  const nameById = new Map<string, string>();

  const push = (map: Map<string, string[]>, key: string, id: string) => {
    if (!key) return;
    const list = map.get(key) ?? [];
    list.push(id);
    map.set(key, list);
  };

  for (const o of orgs) {
    nameById.set(o.id, o.name);
    push(byCode, normalize(o.code), o.id);
    push(byName, normalize(o.name), o.id);
    push(byShortName, normalize(o.shortName), o.id);
  }

  return { byCode, byName, byShortName, nameById };
}

/** Trả về orgId nếu khớp CHÍNH XÁC & DUY NHẤT; null nếu không khớp / mơ hồ. */
function matchOrg(index: OrgIndex, raw: string): { orgId: string | null; ambiguous: boolean } {
  const key = normalize(raw);
  if (!key) return { orgId: null, ambiguous: false };

  // Ưu tiên code → name → shortName.
  for (const map of [index.byCode, index.byName, index.byShortName]) {
    const hit = map.get(key);
    if (hit && hit.length === 1) return { orgId: hit[0], ambiguous: false };
    if (hit && hit.length > 1) return { orgId: null, ambiguous: true };
  }
  return { orgId: null, ambiguous: false };
}

async function main() {
  console.log(`\n=== Backfill PartyMember.organizationId từ partyCell/partyCommittee ===`);
  console.log(`Chế độ: ${APPLY ? 'APPLY (ghi DB)' : 'DRY-RUN (không ghi DB)'}\n`);

  const orgs = await prisma.partyOrganization.findMany({
    select: { id: true, code: true, name: true, shortName: true },
  });
  const index = buildOrgIndex(orgs);
  console.log(`Đã nạp ${orgs.length} tổ chức Đảng để so khớp.`);

  const candidates = await prisma.partyMember.findMany({
    where: {
      deletedAt: null,
      organizationId: null,
      OR: [
        { partyCell: { not: null } },
        { partyCommittee: { not: null } },
      ],
    },
    select: {
      id: true,
      partyCell: true,
      partyCommittee: true,
      user: { select: { name: true, militaryId: true } },
    },
  });
  console.log(`Tìm thấy ${candidates.length} member cần backfill (organizationId null + có chi bộ legacy).\n`);

  let matched = 0;
  let ambiguous = 0;
  let unmatched = 0;

  for (const m of candidates) {
    const source = m.partyCell || m.partyCommittee || '';
    const { orgId, ambiguous: isAmbiguous } = matchOrg(index, source);
    const who = `${m.user?.name ?? '—'} (${m.user?.militaryId ?? m.id})`;

    if (orgId) {
      matched += 1;
      console.log(`  ✓ ${who}: "${source}" → ${index.nameById.get(orgId)}`);
      if (APPLY) {
        await prisma.partyMember.update({
          where: { id: m.id },
          data: { organizationId: orgId },
        });
      }
    } else if (isAmbiguous) {
      ambiguous += 1;
      console.log(`  ? ${who}: "${source}" → KHỚP NHIỀU tổ chức, bỏ qua (cần xử lý thủ công)`);
    } else {
      unmatched += 1;
      console.log(`  ✗ ${who}: "${source}" → không khớp tổ chức nào`);
    }
  }

  console.log(`\n=== Tổng kết ===`);
  console.log(`  Khớp & ${APPLY ? 'đã ghi' : 'sẽ ghi'}: ${matched}`);
  console.log(`  Mơ hồ (bỏ qua):           ${ambiguous}`);
  console.log(`  Không khớp:               ${unmatched}`);
  if (!APPLY && matched > 0) {
    console.log(`\nChạy lại với --apply để ghi ${matched} bản ghi.`);
  }
}

main()
  .catch((err) => {
    console.error('Backfill thất bại:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
