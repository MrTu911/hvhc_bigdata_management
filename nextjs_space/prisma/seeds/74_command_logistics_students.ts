/**
 * SEED 74 — Hệ 2: Học viên Chủ nhiệm hậu cần trung/lữ đoàn (dài hạn) (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension). Phụ thuộc: 72 (units ext), 02 (positions).
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/74_command_logistics_students.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_command_logistics_students.ts')

export async function seedCommandLogisticsStudents() {
  console.log('\n[74] Seeding Hệ 2 — Chủ nhiệm hậu cần (dài hạn)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[74] Command logistics students ✓')
}

if (require.main === module) {
  seedCommandLogisticsStudents().catch((e) => {
    console.error('[74] FAILED:', e.message)
    process.exit(1)
  })
}
