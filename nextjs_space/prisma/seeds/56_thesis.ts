/**
 * SEED 56 — Thesis (Khóa luận / Luận văn — M10)
 * Nhóm: DEMO — M10 Đào tạo
 * Phụ thuộc: 51_students, 11_faculty_profiles
 * Phục vụ: M10 Education — đề tài khóa luận/luận văn (UC-59)
 *
 * Tạo (model ThesisProject):
 *   - Các đề tài khóa luận/luận văn demo gắn học viên + giảng viên hướng dẫn
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/56_thesis.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_thesis_demo.ts')

export async function seedThesis() {
  console.log('\n[56] Seeding Thesis Projects (M10)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[56] Thesis Projects ✓')
}

if (require.main === module) {
  seedThesis().catch(e => { console.error('[56] FAILED:', e.message); process.exit(1) })
}
