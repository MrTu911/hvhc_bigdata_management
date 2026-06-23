/**
 * SEED 73 — Học viên Sau đại học (Cao học HCQS/Tài chính + NCS) (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension). Phụ thuộc: 72 (units ext), 02 (positions).
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/73_postgrad_students.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_postgrad_students.ts')

export async function seedPostgradStudents() {
  console.log('\n[73] Seeding học viên Sau đại học (Cao học + NCS)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[73] Postgrad students ✓')
}

if (require.main === module) {
  seedPostgradStudents().catch((e) => {
    console.error('[73] FAILED:', e.message)
    process.exit(1)
  })
}
