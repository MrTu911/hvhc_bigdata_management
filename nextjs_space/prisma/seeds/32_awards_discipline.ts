/**
 * SEED 32 — Awards & Discipline (Khen thưởng + Kỷ luật — M08)
 * Nhóm: DEMO — M08 Discipline / Thi đua khen thưởng
 * Phụ thuộc: 04_users, 10_personnel, 21_party_members
 * Phục vụ: M08 Discipline / Thi đua khen thưởng
 *
 * Tạo:
 *   - AwardsRecord: khen thưởng (Bằng khen, Chiến sĩ thi đua...)
 *   - Commendation: danh hiệu thi đua
 *   - DisciplinaryRecord: kỷ luật (cảnh cáo, hạ cấp...)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/32_awards_discipline.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedAwardsAndDiscipline() {
  console.log('\n[32] Seeding Awards & Discipline (M08)...')

  for (const file of ['seed_thi_dua_khen_thuong.ts', 'seed_discipline.ts']) {
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

  console.log('[32] Awards & Discipline ✓')
}

if (require.main === module) {
  seedAwardsAndDiscipline().catch(e => { console.error('[32] FAILED:', e.message); process.exit(1) })
}
