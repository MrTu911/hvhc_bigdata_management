/**
 * Phase 3 — Tách 45 user CHI_HUY_KHOA_PHONG: gắn đúng `User.unitId` + `UserPosition` + nhãn role.
 *
 * Bám thiết kế RBAC: scope/CSDL đến từ Position + vị trí đơn vị trong cây, KHÔNG từ role enum.
 * Việc quan trọng nhất là gắn `User.unitId` (36/45 đang NULL → scope rỗng).
 *
 * Cơ chế: khớp text `department`/`unit`/`position` của user với `Unit.name` (fuzzy, đã chuẩn hóa
 * dấu), suy ra role coarse + Position theo `Unit.type`. In bảng review; chỉ ghi khi `--apply`.
 *
 *   npx tsx --require dotenv/config scripts/migrate_chi_huy_khoa_phong_split.ts            # dry-run
 *   npx tsx --require dotenv/config scripts/migrate_chi_huy_khoa_phong_split.ts --apply    # ghi DB
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

/** Bỏ dấu tiếng Việt + lowercase + gộp khoảng trắng → phục vụ so khớp. */
function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(s: string): Set<string> {
  // Bỏ token loại đơn vị (đã scope theo type) + vài token nhiễu; GIỮ token định danh (xang/dau/quan/nhu…)
  const stop = new Set(['khoa', 'phong', 'he', 'ban', 'tieu', 'doan', 'vien', 'bo', 'mon', 'dt']);
  return new Set(normalizeText(s).split(' ').filter((t) => t.length > 1 && !stop.has(t)));
}

type UnitTypeGuess = 'KHOA' | 'PHONG' | 'HE' | 'TIEU_DOAN' | 'BAN' | 'VIEN';

/** Suy ra loại đơn vị mong đợi từ text position/department/unit của user. */
function inferExpectedType(position: string, department: string, unit: string): UnitTypeGuess | null {
  const p = normalizeText(position);
  const d = normalizeText(department);
  const u = (unit || '').trim();
  // Gồm cả text unit (nhiều user để tên đơn vị ở field unit, vd "Phòng Đào tạo", "Khoa Tài chính")
  const all = `${p} ${d} ${normalizeText(unit)}`;

  // Mã đơn vị (ưu tiên — rõ ràng nhất)
  if (/^TD\d/i.test(u)) return 'TIEU_DOAN';
  if (/^K\d/i.test(u)) return 'KHOA';
  if (/^H\d/i.test(u)) return 'HE';
  if (/^VIEN/i.test(u)) return 'VIEN';

  // Từ khóa chức danh / tên đơn vị
  if (/tieu doan/.test(all)) return 'TIEU_DOAN';
  if (/\bhe\b|he truong|he dt|he ch|he quan|he quoc/.test(all)) return 'HE';
  if (/vien truong|^vien|nghien cuu kh/.test(all)) return 'VIEN';
  if (/truong phong|chanh vp|van phong|pho truong phong|^phong|\bphong\b/.test(all)) return 'PHONG';
  if (/cn khoa|chu nhiem khoa|^khoa|\bkhoa\b/.test(all)) return 'KHOA';
  if (/truong ban|^ban|\bban\b/.test(all)) return 'BAN';
  return null;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Override thủ công (theo User.name) → Unit.code. Dùng cho ca viết tắt/mơ hồ.
 * 3 ca dưới là viết tắt rõ ràng, đã đối chiếu chắc chắn. Các ca còn lại chờ người dùng xác nhận.
 */
const UNIT_OVERRIDES: Record<string, string> = {
  'Vũ Văn Tùng': 'B7',     // "Phòng Sau ĐH" → Phòng Sau đại học
  'Bùi Văn Hải': 'HE1',    // "Hệ ĐT Sau ĐH" → Hệ đào tạo Sau đại học
  'Nguyễn Hải Định': 'HE2', // "Hệ CH Tham mưu" → Hệ Chỉ huy tham mưu
  // ── CHỜ NGƯỜI DÙNG XÁC NHẬN (đơn vị không khớp tự động) ──
  // 'Đại tá Phạm Đức Lực': '???',   // KCNTT / "Chỉ huy Khoa" — không có Khoa CNTT
  // 'Lê Đình Quân': '???',          // "Phòng HC-KT" — Hậu cần hay Kỹ thuật?
  // 'Nguyễn Quốc Hoài': '???',      // "Tạp chí NCKH-HCQS" — chưa có đơn vị Tạp chí
  // 'Thượng tá Trần Đức Minh': '???', // "Khoa CNTT" — không có; Ban CNTT?
  // 'Nguyễn Ngọc Sơn': '???',       // "Phòng KHQS" — Phòng Khoa học?
  // 'Nguyễn Mạnh Hùng': '???',      // "Hệ Quản lý HV" — không có Hệ tên này
  // 5 user dept/unit/pos = NULL: Phạm Đức Dũng, Nguyễn Văn Chính, Lê Văn Hùng(1), Vũ Thanh Long, Trần Thị Hương
};

/** Map Unit.type → role coarse (nhãn UI). */
function roleForUnitType(type: string): UserRole | null {
  switch (type) {
    case 'KHOA':
    case 'VIEN':
      return UserRole.CHI_HUY_KHOA;
    case 'PHONG':
      return UserRole.CHI_HUY_PHONG;
    case 'HE':
      return UserRole.CHI_HUY_HE;
    case 'TIEU_DOAN':
      return UserRole.CHI_HUY_TIEU_DOAN;
    case 'BAN':
      return UserRole.CHI_HUY_BAN;
    default:
      return null;
  }
}

/** Map (Unit.type, Unit.code) → Position code RBAC (CSDL chuyên sâu theo chức năng phòng). */
function positionForUnit(type: string, code: string): string | null {
  if (type === 'PHONG') {
    const byCode: Record<string, string> = {
      B1: 'TRUONG_PHONG_DAO_TAO',
      B2: 'TRUONG_PHONG_KHOA_HOC',
      B3: 'TRUONG_PHONG_DANG',
    };
    return byCode[code] ?? 'CHI_HUY_PHONG';
  }
  switch (type) {
    case 'KHOA':
    case 'VIEN':
      return 'CHI_HUY_KHOA';
    case 'HE':
      return 'CHI_HUY_HE';
    case 'TIEU_DOAN':
      return 'CHI_HUY_TIEU_DOAN';
    case 'BAN':
      return 'CHI_HUY_BAN';
    default:
      return null;
  }
}

type UnitLite = { id: string; code: string; name: string; type: string };

function bestUnitMatch(
  signals: string[],
  units: UnitLite[],
): { unit: UnitLite; score: number } | null {
  let best: { unit: UnitLite; score: number } | null = null;
  for (const sig of signals) {
    if (!sig) continue;
    const sigNorm = normalizeText(sig);
    const sigTokens = tokenSet(sig);
    for (const u of units) {
      const nameNorm = normalizeText(u.name);
      let score = 0;
      if (sigNorm === nameNorm) score = 1.0;
      else if (sigNorm && (nameNorm.includes(sigNorm) || sigNorm.includes(nameNorm))) score = 0.85;
      else score = jaccard(sigTokens, tokenSet(u.name));
      if (!best || score > best.score) best = { unit: u, score };
    }
  }
  return best;
}

async function main(): Promise<void> {
  console.log(APPLY ? '*** APPLY MODE — ghi DB ***' : '*** DRY-RUN — không ghi DB (thêm --apply) ***');

  const units = await prisma.unit.findMany({
    where: { active: true, type: { in: ['KHOA', 'PHONG', 'HE', 'TIEU_DOAN', 'BAN', 'VIEN'] } },
    select: { id: true, code: true, name: true, type: true },
  });
  const unitByCode = new Map(units.map((u) => [u.code, u]));

  const users = await prisma.user.findMany({
    where: { role: 'CHI_HUY_KHOA_PHONG' as UserRole },
    select: { id: true, name: true, email: true, position: true, department: true, unit: true, unitId: true },
  });

  console.log(`\nTổng user CHI_HUY_KHOA_PHONG: ${users.length}\n`);
  console.log('NAME | signals | → UNIT (type) | ROLE | POSITION | score');
  console.log('─'.repeat(110));

  const rows: Array<{
    userId: string; name: string; unitId: string; role: UserRole; positionCode: string;
  }> = [];
  let unresolved = 0;

  for (const u of users) {
    const overrideCode = UNIT_OVERRIDES[u.name ?? ''];
    let match: { unit: UnitLite; score: number } | null = null;

    if (overrideCode && unitByCode.has(overrideCode)) {
      match = { unit: unitByCode.get(overrideCode)!, score: 1.0 };
    } else {
      const expectedType = inferExpectedType(u.position ?? '', u.department ?? '', u.unit ?? '');
      if (expectedType) {
        const candidates = units.filter((x) => x.type === expectedType);
        // (1) Khớp mã trực tiếp (Khoa K\d, Tiểu đoàn TD\d — mã user trùng mã DB)
        const codeHit = candidates.find((x) => x.code.toUpperCase() === (u.unit ?? '').trim().toUpperCase());
        if (codeHit) {
          match = { unit: codeHit, score: 1.0 };
        } else {
          // (2) Khớp tên trong đúng loại
          match = bestUnitMatch([u.department ?? '', u.unit ?? ''], candidates);
        }
      }
    }

    if (!match || match.score < 0.5) {
      unresolved++;
      console.log(`⚠ ${u.name} | dept="${u.department}" unit="${u.unit}" pos="${u.position}" | KHÔNG KHỚP (score=${match?.score.toFixed(2) ?? '0'})`);
      continue;
    }

    const role = roleForUnitType(match.unit.type);
    const positionCode = positionForUnit(match.unit.type, match.unit.code);
    if (!role || !positionCode) {
      unresolved++;
      console.log(`⚠ ${u.name} | khớp ${match.unit.name} nhưng type ${match.unit.type} không map được role/position`);
      continue;
    }

    const flag = match.score >= 0.85 ? ' ' : '~';
    console.log(`${flag}${u.name} | "${u.department}"/"${u.unit}" | → ${match.unit.name} (${match.unit.type}) | ${role} | ${positionCode} | ${match.score.toFixed(2)}`);
    rows.push({ userId: u.id, name: u.name ?? '', unitId: match.unit.id, role, positionCode });
  }

  console.log('─'.repeat(110));
  console.log(`Khớp được: ${rows.length} | Cần review tay: ${unresolved}`);

  if (!APPLY) {
    console.log('\nDry-run xong. Review bảng trên; điền UNIT_OVERRIDES cho ca ⚠ rồi chạy --apply.');
    return;
  }

  // Snapshot rollback: lưu trạng thái cũ (role, unitId, userPositions) trước khi ghi
  const snapshot = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, name: true, role: true, unitId: true, userPositions: { select: { id: true, positionId: true, unitId: true, isPrimary: true, isActive: true } } },
  });
  const fs = await import('node:fs');
  const rollbackFile = `scripts/_rollback_chihuy_${Date.now()}.json`;
  fs.writeFileSync(rollbackFile, JSON.stringify(snapshot, null, 2));
  console.log(`\n💾 Đã lưu snapshot rollback: ${rollbackFile}`);

  // Resolve positionId map một lần
  const posCodes = [...new Set(rows.map((r) => r.positionCode))];
  const positions = await prisma.position.findMany({ where: { code: { in: posCodes } }, select: { id: true, code: true } });
  const posIdByCode = new Map(positions.map((p) => [p.code, p.id]));

  let applied = 0;
  for (const r of rows) {
    const positionId = posIdByCode.get(r.positionCode);
    if (!positionId) { console.log(`✗ Bỏ qua ${r.name}: position ${r.positionCode} không tồn tại`); continue; }

    await prisma.$transaction(async (tx) => {
      // (a) gắn đơn vị (fix scope)
      await tx.user.update({ where: { id: r.userId }, data: { unitId: r.unitId, role: r.role } });
      // (b) đồng bộ UserPosition: hạ các primary cũ, upsert primary mới
      await tx.userPosition.updateMany({ where: { userId: r.userId, isPrimary: true }, data: { isPrimary: false } });
      const existing = await tx.userPosition.findFirst({ where: { userId: r.userId, positionId, unitId: r.unitId } });
      if (existing) {
        await tx.userPosition.update({ where: { id: existing.id }, data: { isPrimary: true, isActive: true } });
      } else {
        await tx.userPosition.create({ data: { userId: r.userId, positionId, unitId: r.unitId, isPrimary: true, isActive: true } });
      }
    });
    applied++;
  }
  console.log(`\n✅ Đã áp dụng cho ${applied} user.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
