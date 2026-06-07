/**
 * SEED 83 — ETL Pipelines (Định nghĩa pipeline ETL — M12)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 82_infra_full
 * Phục vụ: M12 Khai thác dữ liệu — luồng ETL về kho dữ liệu
 *
 * Tạo (model PipelineDefinition):
 *   - personnel_etl  — PostgreSQL (FacultyProfile + WorkHistory) → ClickHouse dim_personnel
 *   - education_etl  — PostgreSQL (HocVien + KetQuaHocTap)        → ClickHouse fact_grade_records
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/83_etl_pipelines.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_m12_etl_pipelines.ts')

export async function seedEtlPipelines() {
  console.log('\n[83] Seeding ETL Pipelines (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[83] ETL Pipelines ✓')
}

if (require.main === module) {
  seedEtlPipelines().catch(e => { console.error('[83] FAILED:', e.message); process.exit(1) })
}
