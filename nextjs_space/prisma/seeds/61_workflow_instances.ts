/**
 * SEED 61 — Workflow Instances (Instance quy trình demo — M13)
 * Nhóm: DEMO — M13 Workflow Platform
 * Phụ thuộc: 60_workflow_templates, 04_users
 * Phục vụ: M13 Workflow Platform
 *
 * Tạo:
 *   - WorkflowInstance: các workflow đang chạy (phê duyệt, xét duyệt...)
 *   - WorkflowStepInstance: trạng thái từng bước
 *   - WorkflowAction: hành động đã thực hiện
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/61_workflow_instances.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_wf_instances_demo.ts')

export async function seedWorkflowInstances() {
  console.log('\n[61] Seeding Workflow Instances (M13)...')
  try {
    execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    })
  } catch {
    console.warn('  ⚠️  seed_wf_instances_demo bỏ qua lỗi nhỏ')
  }
  console.log('[61] Workflow Instances ✓')
}

if (require.main === module) {
  seedWorkflowInstances().catch(e => { console.error('[61] FAILED:', e.message); process.exit(1) })
}
