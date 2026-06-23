/**
 * SEED 75 — Lớp ngắn hạn B155 A–F (Chủ nhiệm hậu cần trung/lữ đoàn) (M10)
 * Nhóm: DEMO — M10 Đào tạo (extension). Phụ thuộc: 72 (units ext: HE_BD, B155_A..F), 02.
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/75_short_course_b155.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_short_course_b155.ts')

export async function seedShortCourseB155() {
  console.log('\n[75] Seeding lớp ngắn hạn B155 A–F...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[75] B155 short course ✓')
}

if (require.main === module) {
  seedShortCourseB155().catch((e) => {
    console.error('[75] FAILED:', e.message)
    process.exit(1)
  })
}
