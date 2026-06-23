/**
 * SEED 72 — Mở rộng cây đơn vị đào tạo (Hệ/Lớp) cho học viên (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension)
 * Phụ thuộc: 01_units (HE1–HE4)
 * Tạo: HE_BD + B155 A–F, Cao học HCQS/TC, CNHC dài hạn, Lưu HV Lào/CPC; đổi tên HE3.
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/72_training_systems_ext.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_units_training_systems_ext.ts')

export async function seedTrainingSystemsExt() {
  console.log('\n[72] Seeding mở rộng cây đơn vị đào tạo (Hệ/Lớp)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[72] Training systems ext ✓')
}

if (require.main === module) {
  seedTrainingSystemsExt().catch((e) => {
    console.error('[72] FAILED:', e.message)
    process.exit(1)
  })
}
