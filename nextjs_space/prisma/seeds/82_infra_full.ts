/**
 * SEED 82 — Infrastructure Full (Hạ tầng dữ liệu đầy đủ — M12)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 04_users (cần admin role QUAN_TRI_HE_THONG), 80_bigdata_sources
 * Phục vụ: M12 Khai thác dữ liệu — dịch vụ, pipeline, chất lượng, sao lưu
 *
 * Tạo:
 *   - BigDataService, ServiceAlert
 *   - PipelineDefinition + PipelineRun
 *   - DataQualityRule + DataQualityResult
 *   - WarehouseSyncJob, StorageBucketConfig
 *   - BackupJob, RestoreJob, DisasterRecoveryPlan + Exercise
 *   - MetricThresholdPolicy
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/82_infra_full.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_m12_infra_full.ts')

export async function seedInfraFull() {
  console.log('\n[82] Seeding Infrastructure Full (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[82] Infrastructure Full ✓')
}

if (require.main === module) {
  seedInfraFull().catch(e => { console.error('[82] FAILED:', e.message); process.exit(1) })
}
