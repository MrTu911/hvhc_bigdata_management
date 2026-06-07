/**
 * SEED 13 — Officer Health (Sức khỏe sĩ quan — M02)
 * Nhóm: DEMO — M02 Nhân sự
 * Phụ thuộc: 12_officer_soldiers (OfficerCareer phải có trước)
 * Phục vụ: M02 Personnel — cập nhật phân loại sức khỏe
 *
 * Cập nhật:
 *   - healthCategory, healthNotes, lastHealthCheckDate cho OfficerCareer hiện có
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/13_officer_health.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_officer_health.ts')

export async function seedOfficerHealth() {
  console.log('\n[13] Seeding Officer Health (M02)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[13] Officer Health ✓')
}

if (require.main === module) {
  seedOfficerHealth().catch(e => { console.error('[13] FAILED:', e.message); process.exit(1) })
}
