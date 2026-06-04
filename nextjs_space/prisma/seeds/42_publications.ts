/**
 * SEED 42 — Publications & Councils (Ấn phẩm + Hội đồng KH — M09)
 * Nhóm: DEMO — M09 NCKH
 * Phụ thuộc: 41_research_projects, 40_research_scientists
 * Phục vụ: M09 Science Research
 *
 * Tạo:
 *   - NckhPublication: ấn phẩm khoa học
 *   - NckhPublicationAuthor: tác giả
 *   - ScientificCouncil: hội đồng thẩm định
 *   - ScientificCouncilMember: thành viên hội đồng
 *   - NckhAcceptance: nghiệm thu đề tài
 *   - seed_science_library: thư viện khoa học
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/42_publications.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPublications() {
  console.log('\n[42] Seeding Publications & Councils (M09)...')

  for (const file of [
    'seed_scientific_publications.ts',
    'seed_councils_test.ts',
    'seed_council_test_full.ts',
    'seed_publication_review_demo.ts',
    'seed_science_library.ts',
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

  console.log('[42] Publications & Councils ✓')
}

if (require.main === module) {
  seedPublications().catch(e => { console.error('[42] FAILED:', e.message); process.exit(1) })
}
