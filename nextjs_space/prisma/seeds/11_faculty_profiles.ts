/**
 * SEED 11 — Faculty Profiles (Hồ sơ giảng viên — M04)
 * Nhóm: DEMO — M02/M04 Nhân sự/Giảng viên
 * Phụ thuộc: 04_users, 01_units
 * Phục vụ: M04 Faculty, M09 Research, M10 Teaching
 *
 * Tạo:
 *   - FacultyProfile: bằng cấp, chức danh KH, kinh nghiệm
 *   - EducationHistory: lịch sử học vấn
 *   - WorkExperience: kinh nghiệm công tác
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/11_faculty_profiles.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_faculty_profiles.ts')

export async function seedFacultyProfiles() {
  console.log('\n[11] Seeding Faculty Profiles (M04)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[11] Faculty Profiles ✓')
}

if (require.main === module) {
  seedFacultyProfiles().catch(e => { console.error('[11] FAILED:', e.message); process.exit(1) })
}
