/**
 * SEED 30 — Insurance (BHXH, BHYT — M05)
 * Nhóm: DEMO — M05 Insurance
 * Phụ thuộc: 04_users, 10_personnel
 * Phục vụ: M05 Insurance / BHXH
 *
 * Tạo:
 *   - InsuranceInfo: thông tin BHXH/BHYT cho từng cán bộ
 *   - InsuranceHistory: lịch sử đóng bảo hiểm
 *   - InsuranceDependent: người phụ thuộc
 *   - InsuranceClaim: yêu cầu hưởng chế độ
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/30_insurance.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedInsurance() {
  console.log('\n[30] Seeding Insurance / BHXH (M05)...')

  for (const file of ['seed_insurance.ts', 'seed_insurance_data.ts']) {
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

  console.log('[30] Insurance ✓')
}

if (require.main === module) {
  seedInsurance().catch(e => { console.error('[30] FAILED:', e.message); process.exit(1) })
}
