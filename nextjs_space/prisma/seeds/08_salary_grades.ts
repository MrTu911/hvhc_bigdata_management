/**
 * SEED 08 — Military Salary Grades (Bảng lương quân nhân — M19)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: 03_master_data (cấp bậc quân hàm)
 * Phục vụ: M19 Master Data — bảng lương theo NĐ 204/2004/NĐ-CP
 *
 * Tạo:
 *   - 23 cấp bậc quân hàm → mức lương cơ sở + phụ cấp (model military_salary_grades)
 *
 * Idempotent: TRUNCATE + insert lại (bảng lookup, an toàn).
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/08_salary_grades.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_military_salary_grades.ts')

export async function seedSalaryGrades() {
  console.log('\n[08] Seeding Military Salary Grades (M19)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[08] Military Salary Grades ✓')
}

if (require.main === module) {
  seedSalaryGrades().catch(e => { console.error('[08] FAILED:', e.message); process.exit(1) })
}
