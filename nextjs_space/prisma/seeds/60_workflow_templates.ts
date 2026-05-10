/**
 * SEED 60 — Workflow Templates (Template quy trình — M13)
 * Nhóm: DEMO — M13 Workflow Platform
 * Phụ thuộc: Không (độc lập, chỉ cần DB rỗng)
 * Phục vụ: M13 Workflow Platform, M20 Science Workflow
 *
 * Tạo:
 *   - WorkflowTemplate: template quy trình (phê duyệt luận văn, NCKH, chính sách...)
 *   - WorkflowTemplateVersion: phiên bản template
 *   - WorkflowStepTemplate: các bước trong quy trình
 *   - WorkflowTransitionTemplate: điều kiện chuyển bước
 *   - science-workflow-templates: quy trình NCKH (M20)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/60_workflow_templates.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedWorkflowTemplates() {
  console.log('\n[60] Seeding Workflow Templates (M13 + M20)...')

  for (const file of [
    'seed_m13_workflow_templates.ts',
    'seed_m20_workflow_template.ts',
    'science-workflow-templates.ts',
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

  console.log('[60] Workflow Templates ✓')
}

if (require.main === module) {
  seedWorkflowTemplates().catch(e => { console.error('[60] FAILED:', e.message); process.exit(1) })
}
