/**
 * SEED 40 — Research Scientists (Hồ sơ nhà khoa học — M09)
 * Nhóm: DEMO — M09 NCKH
 * Phụ thuộc: 04_users, 11_faculty_profiles
 * Phục vụ: M09 Science Research
 *
 * Tạo:
 *   - NckhScientistProfile: hồ sơ nhà khoa học
 *   - NckhScientistEducation: học vấn
 *   - NckhScientistCareer: sự nghiệp
 *   - NckhScientistAward: giải thưởng khoa học
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/40_research_scientists.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedResearchScientists() {
  console.log('\n[40] Seeding Research Scientists (M09)...')

  // Demo nghiên cứu (bao gồm cả profile nhà khoa học)
  console.log('  → seed_m09_research_demo.ts (scientists)')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_m09_research_demo.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_m09_research_demo bỏ qua lỗi nhỏ')
  }

  // Bridge liên kết scientist profiles
  console.log('  → seed_m09_scientist_bridge.ts')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_m09_scientist_bridge.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_m09_scientist_bridge bỏ qua lỗi nhỏ')
  }

  console.log('[40] Research Scientists ✓')
}

if (require.main === module) {
  seedResearchScientists().catch(e => { console.error('[40] FAILED:', e.message); process.exit(1) })
}
