/**
 * SEED 52 — Teaching (Giảng dạy — M10)
 * Nhóm: DEMO — M10 Education & Training
 * Phụ thuộc: 51_students, 11_faculty_profiles
 * Phục vụ: M10 Education / Đào tạo
 *
 * Tạo:
 *   - TeachingSubject: môn giảng dạy của giảng viên
 *   - ClassSection: phân công lớp học phần
 *   - TrainingSession: buổi học thực tế
 *   - SessionAttendance: điểm danh
 *   - TeachingStatistics: thống kê giảng dạy
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/52_teaching.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedTeaching() {
  console.log('\n[52] Seeding Teaching Data (M10)...')

  for (const file of ['seed_teaching_data.ts', 'seed_teaching_statistics.ts', 'seed_m10_learning_materials.ts']) {
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

  console.log('[52] Teaching ✓')
}

if (require.main === module) {
  seedTeaching().catch(e => { console.error('[52] FAILED:', e.message); process.exit(1) })
}
