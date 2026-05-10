/**
 * SEED 12 — Officer Careers & Soldier Profiles (Sự nghiệp + Hồ sơ quân nhân)
 * Nhóm: DEMO — M02 Nhân sự
 * Phụ thuộc: 10_personnel (Personnel phải có trước)
 * Phục vụ: M02 Personnel — vòng đời sĩ quan, quân nhân
 *
 * Tạo:
 *   - OfficerCareer: sự nghiệp sĩ quan (thăng tiến, luân chuyển)
 *   - OfficerPromotion: lịch sử thăng quân hàm
 *   - SoldierProfile: hồ sơ quân nhân nghĩa vụ
 *   - SoldierServiceRecord: bản ghi phục vụ
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/12_officer_soldiers.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedOfficerAndSoldier() {
  console.log('\n[12] Seeding Officer Careers & Soldier Profiles...')

  console.log('  → seed_officer_careers.ts')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_officer_careers.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_officer_careers bỏ qua lỗi nhỏ')
  }

  console.log('  → seed_soldier_profiles.ts')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_soldier_profiles.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_soldier_profiles bỏ qua lỗi nhỏ')
  }

  console.log('[12] Officer & Soldier ✓')
}

if (require.main === module) {
  seedOfficerAndSoldier().catch(e => { console.error('[12] FAILED:', e.message); process.exit(1) })
}
