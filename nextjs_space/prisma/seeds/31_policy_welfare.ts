/**
 * SEED 31 — Policy & Welfare (Chính sách phúc lợi — M06)
 * Nhóm: DEMO — M06 Policy
 * Phụ thuộc: 04_users, 10_personnel
 * Phục vụ: M06 Policy / Chính sách
 *
 * Tạo:
 *   - PolicyRequest: yêu cầu chính sách của cán bộ
 *   - PolicyRecord: bản ghi thực hiện chính sách
 *   - PolicyWorkflowLog: log quy trình xử lý
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/31_policy_welfare.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPolicy() {
  console.log('\n[31] Seeding Policy & Welfare (M06)...')

  for (const file of ['seed_policy_full.ts', 'seed_policy_records.ts']) {
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

  console.log('[31] Policy & Welfare ✓')
}

if (require.main === module) {
  seedPolicy().catch(e => { console.error('[31] FAILED:', e.message); process.exit(1) })
}
