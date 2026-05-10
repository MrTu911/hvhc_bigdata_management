/**
 * SEED 10 — Personnel (Hồ sơ cán bộ — M02)
 * Nhóm: DEMO — M02 Nhân sự
 * Phụ thuộc: 01_units, 03_master_data, 04_users
 * Phục vụ: M02 Personnel Core
 *
 * Tạo:
 *   - Hồ sơ cán bộ chi tiết (Personnel) cho 50+ người dùng
 *   - Thông tin gia đình (FamilyRelation)
 *   - Hồ sơ y tế (MedicalRecord)
 *   - Tệp đính kèm hồ sơ (PersonnelAttachment)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/10_personnel.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPersonnel() {
  console.log('\n[10] Seeding Personnel (M02)...')

  // Step 1: Hồ sơ cán bộ đầy đủ
  console.log('  → seed_personnel_demo_full.ts')
  execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_personnel_demo_full.ts')}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })

  // Step 2: Profile + đính kèm
  console.log('  → seed_personnel_profiles_demo_v2.ts')
  try {
    execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_personnel_profiles_demo_v2.ts')}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_personnel_profiles_demo_v2 bỏ qua lỗi nhỏ')
  }

  console.log('[10] Personnel ✓')
}

if (require.main === module) {
  seedPersonnel().catch(e => { console.error('[10] FAILED:', e.message); process.exit(1) })
}
