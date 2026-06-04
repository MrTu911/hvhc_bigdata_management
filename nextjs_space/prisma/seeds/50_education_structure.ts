/**
 * SEED 50 — Education Structure (Cơ sở đào tạo — M10)
 * Nhóm: DEMO — M10 Education & Training
 * Phụ thuộc: 01_units, 03_master_data (AcademicYear trong master data)
 * Phục vụ: M10 Education / Đào tạo
 *
 * Tạo:
 *   - AcademicYear: năm học (2022-2023, 2023-2024, 2024-2025...)
 *   - Term: học kỳ trong từng năm học
 *   - Program: chương trình đào tạo (Cử nhân HC-KT, Thạc sĩ...)
 *   - ProgramVersion: phiên bản chương trình (bắt buộc, không overwrite)
 *   - Course: môn học (với số tín chỉ)
 *   - Room: phòng học / giảng đường
 *   - CurriculumPlan + CurriculumCourse: kế hoạch giảng dạy
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/50_education_structure.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_education.ts')

export async function seedEducationStructure() {
  console.log('\n[50] Seeding Education Structure (M10)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[50] Education Structure ✓')
}

if (require.main === module) {
  seedEducationStructure().catch(e => { console.error('[50] FAILED:', e.message); process.exit(1) })
}
