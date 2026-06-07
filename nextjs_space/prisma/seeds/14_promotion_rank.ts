/**
 * SEED 14 — Promotion & Rank (Thăng quân hàm — M02 + M13 templates)
 * Nhóm: DEMO — M02 Nhân sự
 * Phụ thuộc: 05_rbac_grants, 12_officer_soldiers
 * Phục vụ: M02/M13 — function codes + template kê khai/thăng quân hàm
 *
 * Gộp 2 file (mỗi file độc lập, lỗi file này không chặn file kia):
 *   1. seed_promotion_function_codes.ts      → function codes thăng quân hàm
 *   2. seed_rank_declaration_wf_templates.ts → template workflow kê khai cấp bậc
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/14_promotion_rank.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

const PROMOTION_FILES = [
  'seed_promotion_function_codes.ts',
  'seed_rank_declaration_wf_templates.ts',
]

export async function seedPromotionRank() {
  console.log('\n[14] Seeding Promotion & Rank (M02)...')

  for (const file of PROMOTION_FILES) {
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, file)}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch (err) {
      console.warn(`  ⚠️  [14] ${file} lỗi (bỏ qua):`, (err as Error).message?.split('\n')[0])
    }
  }

  console.log('[14] Promotion & Rank ✓')
}

if (require.main === module) {
  seedPromotionRank().catch(e => { console.error('[14] FAILED:', e.message); process.exit(1) })
}
