/**
 * SEED 15 — Career History (Quá trình công tác — M02)
 * Nhóm: DEMO — M02 Nhân sự
 * Phụ thuộc: 04_users, 06_commanders (chức vụ đang hiệu lực)
 * Phục vụ: trang cá nhân /dashboard/personal/my-career + xuất "Bản quá trình công tác".
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/15_career_history.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_career_history.ts')

export async function seedCareerHistory() {
  console.log('\n[15] Seeding Career History (M02)...')
  try {
    execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch (err) {
    console.warn('  ⚠️  [15] Career History lỗi (bỏ qua):', (err as Error).message?.split('\n')[0])
  }
  console.log('[15] Career History ✓')
}

if (require.main === module) {
  seedCareerHistory().catch(e => { console.error('[15] FAILED:', e.message); process.exit(1) })
}
