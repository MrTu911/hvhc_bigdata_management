/**
 * SEED 55 — Civil Students & Admissions (Học viên dân sự — M10)
 * Nhóm: DEMO — M10 Đào tạo
 * Phụ thuộc: 51_students, 50_education_structure
 * Phục vụ: M10 Education — học viên dân sự + tuyển sinh bổ sung + điểm thiếu
 *
 * Gộp 3 file (mỗi file độc lập, lỗi file này không chặn file kia):
 *   1. seed_civil_students.ts  → 60 học viên dân sự (trainingSystemUnitId = null)
 *   2. seed_admissions_extra.ts → dữ liệu tuyển sinh bổ sung
 *   3. seed_missing_grades.ts   → điền điểm còn thiếu cho học viên
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/55_civil_students.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

const CIVIL_FILES = [
  'seed_civil_students.ts',
  'seed_admissions_extra.ts',
  'seed_missing_grades.ts',
]

export async function seedCivilStudents() {
  console.log('\n[55] Seeding Civil Students & Admissions (M10)...')

  for (const file of CIVIL_FILES) {
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, file)}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch (err) {
      console.warn(`  ⚠️  [55] ${file} lỗi (bỏ qua):`, (err as Error).message?.split('\n')[0])
    }
  }

  console.log('[55] Civil Students & Admissions ✓')
}

if (require.main === module) {
  seedCivilStudents().catch(e => { console.error('[55] FAILED:', e.message); process.exit(1) })
}
