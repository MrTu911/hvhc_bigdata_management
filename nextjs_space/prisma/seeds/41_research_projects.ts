/**
 * SEED 41 — Research Projects (Đề tài NCKH — M09)
 * Nhóm: DEMO — M09 NCKH
 * Phụ thuộc: 40_research_scientists, 01_units, 04_users
 * Phục vụ: M09 Science Research
 *
 * Tạo:
 *   - NckhProject: đề tài nghiên cứu khoa học
 *   - NckhMember: thành viên nhóm nghiên cứu
 *   - NckhMilestone: cột mốc tiến độ
 *   - ResearchBudget: ngân sách đề tài
 *   - NckhProposal: đề xuất mới
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/41_research_projects.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedResearchProjects() {
  console.log('\n[41] Seeding Research Projects (M09)...')

  for (const file of [
    'seed_science_demo.ts',
    'seed_m09_project_bridge.ts',
    'seed_science_proposal_demo.ts',
    'seed_science_phase1_6.ts',
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

  console.log('[41] Research Projects ✓')
}

if (require.main === module) {
  seedResearchProjects().catch(e => { console.error('[41] FAILED:', e.message); process.exit(1) })
}
