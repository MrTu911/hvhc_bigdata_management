/**
 * Seed: Mở rộng cây đơn vị đào tạo (Hệ / Lớp) cho các nhóm học viên còn thiếu.
 *
 * SEED ONLY — dev/demo. Idempotent: upsert theo Unit.code (chạy lại không tạo trùng).
 *
 * Tạo/cập nhật:
 *   - HE_BD (type HE, cùng cấp HE1–HE4) "Hệ Đào tạo ngắn hạn (Bồi dưỡng)"
 *       + B155_A..B155_F (type LOP) — Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)
 *   - LOP_HE1_CHHCQS "Cao học Hậu cần quân sự" (dưới HE1)
 *   - LOP_HE1_CHTC   "Cao học Tài chính"        (dưới HE1)
 *     (NCS reuse HE1_XNSC "Nghiên cứu sinh" đã có)
 *   - LOP_HE2_CNHC_DH "Chủ nhiệm hậu cần trung/lữ đoàn (dài hạn)" (dưới HE2)
 *   - LOP_HE4_LAO / LOP_HE4_CPC "Lưu học viên Lào/Campuchia" (dưới HE4)
 *   - LOP_HE3_DS1 / LOP_HE3_DS2 (dưới HE3) + đổi tên HE3 → Hệ Dân sự
 *     (đổi tên là thao tác KHÔNG phá huỷ, reversible).
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_units_training_systems_ext.ts
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

interface UnitSeed {
  code: string
  name: string
  parentCode: string
  description?: string
}

/** Upsert 1 Unit theo code; level = parent.level + 1; type cố định 'LOP'. */
async function upsertLop(seed: UnitSeed): Promise<'created' | 'updated'> {
  const parent = await prisma.unit.findUnique({
    where: { code: seed.parentCode },
    select: { id: true, level: true },
  })
  if (!parent) throw new Error(`❌ Không tìm thấy parent Unit code='${seed.parentCode}'`)

  const existing = await prisma.unit.findUnique({ where: { code: seed.code }, select: { id: true } })
  await prisma.unit.upsert({
    where: { code: seed.code },
    update: { name: seed.name, parentId: parent.id, level: parent.level + 1, active: true, description: seed.description },
    create: {
      code: seed.code,
      name: seed.name,
      type: 'LOP',
      level: parent.level + 1,
      parentId: parent.id,
      active: true,
      description: seed.description,
    },
  })
  return existing ? 'updated' : 'created'
}

async function main() {
  console.log('🏗️  Seeding mở rộng cây đơn vị đào tạo (Hệ/Lớp)...\n')

  // ── 1. Nhánh mới: Hệ Đào tạo ngắn hạn (Bồi dưỡng), cùng cấp với HE1–HE4 ──────────
  const he1 = await prisma.unit.findUnique({
    where: { code: 'HE1' },
    select: { parentId: true, level: true },
  })
  if (!he1) throw new Error("❌ Không tìm thấy Hệ HE1. Hãy seed units (step units) trước.")

  await prisma.unit.upsert({
    where: { code: 'HE_BD' },
    update: { name: 'Hệ Đào tạo ngắn hạn (Bồi dưỡng)', parentId: he1.parentId, level: he1.level, active: true },
    create: {
      code: 'HE_BD',
      name: 'Hệ Đào tạo ngắn hạn (Bồi dưỡng)',
      type: 'HE',
      level: he1.level,
      parentId: he1.parentId,
      active: true,
      description: 'Các lớp đào tạo ngắn hạn / bồi dưỡng (vd B155 — chủ nhiệm hậu cần trung/lữ đoàn).',
    },
  })
  console.log('✓ HE_BD — Hệ Đào tạo ngắn hạn (Bồi dưỡng)')

  // ── 2. Đổi tên HE3 → Hệ Dân sự (phản ánh đúng "Hệ 3 = đào tạo dân sự 4 năm") ──────
  await prisma.unit.update({
    where: { code: 'HE3' },
    data: { name: 'Hệ Đào tạo Dân sự (chuyên ngành 4 năm)' },
  })
  console.log('✓ HE3 → Hệ Đào tạo Dân sự (chuyên ngành 4 năm)')

  // ── 3. Các lớp mới ───────────────────────────────────────────────────────────────
  const lopSeeds: UnitSeed[] = [
    // B155 A–F dưới Hệ Bồi dưỡng
    { code: 'B155_A', name: 'Lớp B155 A – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    { code: 'B155_B', name: 'Lớp B155 B – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    { code: 'B155_C', name: 'Lớp B155 C – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    { code: 'B155_D', name: 'Lớp B155 D – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    { code: 'B155_E', name: 'Lớp B155 E – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    { code: 'B155_F', name: 'Lớp B155 F – Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn)', parentCode: 'HE_BD' },
    // Cao học dưới Hệ 1 (Sau đại học)
    { code: 'LOP_HE1_CHHCQS', name: 'Cao học Hậu cần quân sự', parentCode: 'HE1' },
    { code: 'LOP_HE1_CHTC', name: 'Cao học Tài chính', parentCode: 'HE1' },
    // Hệ 2 — Chủ nhiệm hậu cần dài hạn
    { code: 'LOP_HE2_CNHC_DH', name: 'Chủ nhiệm hậu cần trung/lữ đoàn (dài hạn)', parentCode: 'HE2' },
    // Hệ 4 — Lưu học viên quốc tế
    { code: 'LOP_HE4_LAO', name: 'Lưu học viên Lào', parentCode: 'HE4' },
    { code: 'LOP_HE4_CPC', name: 'Lưu học viên Campuchia', parentCode: 'HE4' },
    // Hệ 3 — Lớp dân sự
    { code: 'LOP_HE3_DS1', name: 'Lớp Dân sự DS1', parentCode: 'HE3' },
    { code: 'LOP_HE3_DS2', name: 'Lớp Dân sự DS2', parentCode: 'HE3' },
  ]

  let created = 0
  let updated = 0
  for (const s of lopSeeds) {
    const res = await upsertLop(s)
    if (res === 'created') created++
    else updated++
    console.log(`  ${res === 'created' ? '＋' : '↻'} ${s.code} — ${s.name}`)
  }

  console.log('\n===== SEED ĐƠN VỊ ĐÀO TẠO MỞ RỘNG =====')
  console.log(`Lớp tạo mới:    ${created}`)
  console.log(`Lớp cập nhật:   ${updated}`)
  console.log('========================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
