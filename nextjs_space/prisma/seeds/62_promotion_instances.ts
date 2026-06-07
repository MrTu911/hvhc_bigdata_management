/**
 * SEED 62 — Promotion Alert Workflow Instances (M13)
 * Nhóm: DEMO — M13 Workflow
 * Phụ thuộc: 14_promotion_rank (template), 61_workflow_instances
 * Phục vụ: M13 Workflow — instance cảnh báo / đề nghị thăng quân hàm
 *
 * Tạo:
 *   - WorkflowInstance + task demo cho luồng cảnh báo thăng quân hàm
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/62_promotion_instances.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_promotion_alert_wf_instance.ts')

export async function seedPromotionInstances() {
  console.log('\n[62] Seeding Promotion Alert Workflow Instances (M13)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[62] Promotion Alert Instances ✓')
}

if (require.main === module) {
  seedPromotionInstances().catch(e => { console.error('[62] FAILED:', e.message); process.exit(1) })
}
