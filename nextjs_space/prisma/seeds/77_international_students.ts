/**
 * SEED 77 — Hệ 4: Học viên quốc tế (Lào + Campuchia) (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension). Phụ thuộc: 72 (units ext: HE4, LOP_HE4_LAO/CPC), 02.
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/77_international_students.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_international_students.ts')

export async function seedInternationalStudents() {
  console.log('\n[77] Seeding Hệ 4 — Học viên quốc tế (Lào + Campuchia)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[77] International students ✓')
}

if (require.main === module) {
  seedInternationalStudents().catch((e) => {
    console.error('[77] FAILED:', e.message)
    process.exit(1)
  })
}
