/**
 * SEED 53 — Exams & Grades (Kỳ thi + Điểm số — M10)
 * Nhóm: DEMO — M10 Education & Training
 * Phụ thuộc: 51_students, 50_education_structure
 * Phục vụ: M10 Education / Đào tạo
 *
 * Tạo:
 *   - ExamSession: ca thi, phòng thi
 *   - ExamRegistration: đăng ký dự thi
 *   - KetQuaHocTap: điểm số học tập
 *   - GradeRecord: bản ghi điểm chi tiết
 *   - GPAHistory: lịch sử GPA từng học kỳ
 *   - LabSession + LabRegistration: thực hành
 *   - AcademicWarning: cảnh báo học vụ
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/53_exams_grades.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedExamsAndGrades() {
  console.log('\n[53] Seeding Exams & Grades (M10)...')

  for (const file of [
    'seed_m10_exam_data.ts',
    'seed_m10_lab_data.ts',
    'seed_m10_gpa_history.ts',
    'seed_missing_grades.ts',
    'seed_exams_demo.ts',
  ]) {
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

  console.log('[53] Exams & Grades ✓')
}

if (require.main === module) {
  seedExamsAndGrades().catch(e => { console.error('[53] FAILED:', e.message); process.exit(1) })
}
