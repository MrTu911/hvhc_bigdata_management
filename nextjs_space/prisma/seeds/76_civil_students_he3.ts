/**
 * SEED 76 — Hệ 3: Sinh viên dân sự (4 năm) + backfill SV2024 vào Hệ 3 (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension). Phụ thuộc: 72 (units ext: HE3, LOP_HE3_DS*), 02.
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/76_civil_students_he3.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_civil_students_he3.ts')

export async function seedCivilStudentsHe3() {
  console.log('\n[76] Seeding Hệ 3 — Sinh viên dân sự (4 năm)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[76] Civil students Hệ 3 ✓')
}

if (require.main === module) {
  seedCivilStudentsHe3().catch((e) => {
    console.error('[76] FAILED:', e.message)
    process.exit(1)
  })
}
