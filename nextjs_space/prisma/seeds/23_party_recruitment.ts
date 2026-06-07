/**
 * SEED 23 — Party Recruitment Pipeline (Quy trình kết nạp Đảng — M03)
 * Nhóm: DEMO — M03 Đảng
 * Phụ thuộc: 21_party_members (User + PartyOrganization phải có trước)
 * Phục vụ: M03 Party Management — vòng đời phát triển đảng viên
 *
 * Tạo (model PartyRecruitmentPipeline):
 *   - 32 hồ sơ phát triển Đảng trải đều 6 bước:
 *     THEO_DOI → HOC_CAM_TINH → DOI_TUONG → CHI_BO_XET → CAP_TREN_DUYET → DA_KET_NAP
 *
 * Idempotent & portable: resolve User.id theo militaryId (HV000500–531) + party org
 * theo runtime, KHÔNG hard-code cuid.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/23_party_recruitment.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_recruitment_pipeline.ts')

export async function seedPartyRecruitment() {
  console.log('\n[23] Seeding Party Recruitment Pipeline (M03)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[23] Party Recruitment ✓')
}

if (require.main === module) {
  seedPartyRecruitment().catch(e => { console.error('[23] FAILED:', e.message); process.exit(1) })
}
