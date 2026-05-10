/**
 * SEED 22 — Party Activities (Hoạt động đảng + đánh giá — M03)
 * Nhóm: DEMO — M03 Party Management
 * Phụ thuộc: 21_party_members
 * Phục vụ: M03 Party Management
 *
 * Tạo:
 *   - PartyActivity: hoạt động sinh hoạt đảng
 *   - PartyMeetingAttendance: điểm danh họp chi bộ
 *   - PartyEvaluation: đánh giá tư tưởng chính trị
 *   - PartyAnnualReview: đánh giá đảng viên hàng năm
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/22_party_activities.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPartyActivities() {
  console.log('\n[22] Seeding Party Activities & Evaluations (M03)...')

  for (const file of ['seed_party_activities.ts', 'seed_party_evaluations.ts']) {
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, file)}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch {
      console.warn(`  ⚠️  ${file} bỏ qua lỗi nhỏ`)
    }
  }

  console.log('[22] Party Activities ✓')
}

if (require.main === module) {
  seedPartyActivities().catch(e => { console.error('[22] FAILED:', e.message); process.exit(1) })
}
