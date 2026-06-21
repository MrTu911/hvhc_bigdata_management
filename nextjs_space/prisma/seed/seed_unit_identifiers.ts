/**
 * SEED — Mã định danh điện tử chuẩn HVHC (QĐ 3843/QĐ-HV, theo QĐ 2934/QĐ-BQP)
 *
 * Đối chiếu + bổ sung (idempotent, NON-DESTRUCTIVE):
 *  - Khớp đơn vị đã có (theo identifierCode → matchCode/code → tên chuẩn hóa trong cùng cha)
 *    rồi gắn `identifierCode`. KHÔNG đổi name/parentId/code để bảo toàn phân công nhân sự.
 *  - Tạo MỚI các đơn vị con còn thiếu theo QĐ (code = identifierCode).
 *  - KHÔNG xóa, KHÔNG null hóa FK. Đơn vị hiện có ngoài QĐ được giữ nguyên + liệt kê trong báo cáo.
 *
 * Khác hẳn seed_units.ts (script đó wipe toàn bộ unit). Script này an toàn để chạy trên DB thật.
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_unit_identifiers.ts
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

const LOG = '[seed:unit-identifiers]';
const ACADEMY_IDENTIFIER = 'G11.40'; // Mã định danh gốc Học viện (theo QĐ-BQP)

interface IdentifierUnitDef {
  identifierCode: string;
  name: string;
  type: string;
  level: number;
  parentIdentifier: string | null;
  matchCode?: string;
}

// ─── chuẩn hóa tên để đối chiếu ──────────────────────────────────────────────

const TYPE_PREFIXES = [
  // đa-từ trước, đơn-từ sau (tránh strip nhầm)
  'bo mon', 'tieu doan', 'dai doi', 'trung tam', 'uy ban', 'thanh tra', 'benh xa',
  'phong', 'khoa', 'ban', 'vien', 'xuong', 'tram', 'he', 'to', 'lop',
];

/** Bỏ dấu, lowercase, gộp khoảng trắng, chuẩn hóa dấu nối. */
function normalizeName(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/[–—-]/g, ' ').replace(/[.,;:]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** Bỏ tiền tố loại đơn vị (vd "bo mon ky thuat" → "ky thuat") để khớp tên thật. */
function stripTypePrefix(normalized: string): string {
  for (const prefix of TYPE_PREFIXES) {
    if (normalized === prefix) return normalized;
    if (normalized.startsWith(prefix + ' ')) return normalized.slice(prefix.length + 1).trim();
  }
  return normalized;
}

/** Khóa đối chiếu tên cuối cùng. */
function nameMatchKey(raw: string): string {
  return stripTypePrefix(normalizeName(raw));
}

// ─── tìm đơn vị khớp ─────────────────────────────────────────────────────────

/**
 * Thứ tự ưu tiên: (a) đã có identifierCode → (b) matchCode → (b2) code trùng identifierCode
 * → (c) tên chuẩn hóa trong cùng đơn vị cha. Bỏ qua các unit đã được dùng (consumed).
 */
async function findMatchingUnit(
  def: IdentifierUnitDef,
  parentId: string,
  consumed: Set<string>,
) {
  // (a)
  const byIdentifier = await prisma.unit.findUnique({ where: { identifierCode: def.identifierCode } });
  if (byIdentifier && !consumed.has(byIdentifier.id)) return byIdentifier;

  // (b)
  if (def.matchCode) {
    const byMatchCode = await prisma.unit.findUnique({ where: { code: def.matchCode } });
    if (byMatchCode && !consumed.has(byMatchCode.id)) return byMatchCode;
  }

  // (b2) — tránh đụng unique khi code đã = identifierCode (vd run trước tạo dở)
  const byCode = await prisma.unit.findUnique({ where: { code: def.identifierCode } });
  if (byCode && !consumed.has(byCode.id)) return byCode;

  // (c)
  const targetKey = nameMatchKey(def.name);
  const siblings = await prisma.unit.findMany({ where: { parentId } });
  for (const sibling of siblings) {
    if (consumed.has(sibling.id)) continue;
    if (nameMatchKey(sibling.name) === targetKey) return sibling;
  }

  return null;
}

// ─── gốc Học viện ────────────────────────────────────────────────────────────

async function ensureAcademyRoot() {
  let root = await prisma.unit.findUnique({ where: { code: 'HVHC' } });
  if (!root) {
    root = await prisma.unit.create({
      data: {
        code: 'HVHC',
        identifierCode: ACADEMY_IDENTIFIER,
        name: 'Học viện Hậu cần',
        type: 'HVHC',
        level: 1,
        path: 'HVHC',
        active: true,
      },
    });
    console.log(`${LOG} Tạo gốc Học viện [HVHC] (${ACADEMY_IDENTIFIER})`);
  } else if (root.identifierCode !== ACADEMY_IDENTIFIER) {
    root = await prisma.unit.update({
      where: { id: root.id },
      data: { identifierCode: ACADEMY_IDENTIFIER },
    });
    console.log(`${LOG} Gắn mã định danh gốc [HVHC] = ${ACADEMY_IDENTIFIER}`);
  }
  return root;
}

// ─── reconcile chính ─────────────────────────────────────────────────────────

async function reconcileIdentifiers() {
  const defs: IdentifierUnitDef[] = JSON.parse(
    readFileSync(join(__dirname, 'data', 'ma_dinh_danh_hvhc.json'), 'utf-8'),
  );

  const root = await ensureAcademyRoot();

  const identifierToId = new Map<string, string>();
  const consumed = new Set<string>([root.id]);
  const nameMismatches: string[] = [];
  let matched = 0;
  let created = 0;

  // Cha trước con
  const sorted = [...defs].sort((a, b) => a.level - b.level);

  for (const def of sorted) {
    const parentId = def.parentIdentifier
      ? identifierToId.get(def.parentIdentifier)
      : root.id;

    if (!parentId) {
      console.warn(`${LOG} ⚠️  Bỏ qua ${def.identifierCode} — chưa giải được đơn vị cha '${def.parentIdentifier}'`);
      continue;
    }

    const existing = await findMatchingUnit(def, parentId, consumed);

    if (existing) {
      if (existing.identifierCode !== def.identifierCode) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: { identifierCode: def.identifierCode },
        });
      }
      consumed.add(existing.id);
      identifierToId.set(def.identifierCode, existing.id);
      matched++;

      if (nameMatchKey(existing.name) !== nameMatchKey(def.name)) {
        nameMismatches.push(
          `${def.identifierCode}: QĐ "${def.name}" ↔ hệ thống "${existing.name}" [${existing.code}]`,
        );
      }
      continue;
    }

    // Tạo mới — code = identifierCode (unique, ≤14 ký tự)
    const parent = await prisma.unit.findUnique({ where: { id: parentId }, select: { path: true } });
    const path = parent?.path ? `${parent.path}/${def.identifierCode}` : def.identifierCode;

    const createdUnit = await prisma.unit.create({
      data: {
        code: def.identifierCode,
        identifierCode: def.identifierCode,
        name: def.name,
        type: def.type,
        level: def.level,
        parentId,
        path,
        active: true,
      },
    });
    consumed.add(createdUnit.id);
    identifierToId.set(def.identifierCode, createdUnit.id);
    created++;
    console.log(`${LOG}   + Tạo mới [${def.identifierCode}] ${def.name}`);
  }

  // Đơn vị hiện có KHÔNG nằm trong QĐ (giữ nguyên — chỉ liệt kê)
  const allUnits = await prisma.unit.findMany({
    select: { id: true, code: true, name: true, type: true, active: true },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });
  const notInDecision = allUnits.filter((u) => !consumed.has(u.id));

  // ─── báo cáo ───
  console.log(`\n${LOG} ===== KẾT QUẢ ĐỐI CHIẾU =====`);
  console.log(`${LOG} Khớp & gắn mã (matched): ${matched}`);
  console.log(`${LOG} Tạo mới (created):       ${created}`);
  console.log(`${LOG} Tổng đơn vị trong QĐ:    ${defs.length} (+1 gốc HVHC)`);

  if (nameMismatches.length > 0) {
    console.log(`\n${LOG} ⚠️  Tên lệch giữa QĐ và hệ thống (${nameMismatches.length}) — giữ tên hệ thống, cần rà tay:`);
    nameMismatches.forEach((m) => console.log(`${LOG}    - ${m}`));
  }

  if (notInDecision.length > 0) {
    console.log(`\n${LOG} ℹ️  Đơn vị hiện có KHÔNG có trong QĐ 3843 (${notInDecision.length}) — GIỮ NGUYÊN, không gắn mã:`);
    notInDecision.forEach((u) =>
      console.log(`${LOG}    - [${u.code}] ${u.name} (${u.type})${u.active ? '' : ' [inactive]'}`),
    );
  }

  return { matched, created, nameMismatches: nameMismatches.length, notInDecision: notInDecision.length };
}

async function main() {
  console.log('='.repeat(64));
  console.log('  SEED — Mã định danh điện tử HVHC (QĐ 3843/QĐ-HV)');
  console.log('='.repeat(64));

  await reconcileIdentifiers();

  const total = await prisma.unit.count({ where: { identifierCode: { not: null } } });
  console.log(`\n${LOG} Tổng đơn vị đã có identifierCode trong DB: ${total}`);
  console.log('='.repeat(64));
  console.log('  ✅ HOÀN THÀNH');
  console.log('='.repeat(64));
}

main()
  .catch((e) => {
    console.error(`${LOG} ❌ FAILED:`, e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
