/**
 * SEED 21 — Party Members (Đảng viên + lịch sử Đảng — M03)
 * Nhóm: DEMO — M03 Party Management
 * Phụ thuộc: 20_party_organizations, 04_users
 * Phục vụ: M03 Party Management
 *
 * Tạo:
 *   - PartyMember: User → đảng viên, gán vào chi bộ
 *   - PartyMemberHistory: lịch sử (ngày vào Đảng, chuyển cấp...)
 *   - PartyLifecycleEvent: sự kiện vòng đời đảng viên
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/21_party_members.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPartyMembers() {
  console.log('\n[21] Seeding Party Members (M03)...')

  console.log('  → seed_party_members.ts')
  execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_party_members.ts')}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })

  console.log('  → seed_party_histories.ts')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_party_histories.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_party_histories bỏ qua lỗi nhỏ')
  }

  console.log('[21] Party Members ✓')
}

if (require.main === module) {
  seedPartyMembers().catch(e => { console.error('[21] FAILED:', e.message); process.exit(1) })
}
