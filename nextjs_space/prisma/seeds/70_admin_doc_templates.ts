/**
 * SEED 70 — Mẫu văn bản hành chính (Nghị định 30/2020 — M18)
 * Nhóm: DEMO — M18 Export & Template Platform
 * Phụ thuộc: 04_users (cần 1 user làm createdBy)
 * Phục vụ: Thư viện mẫu văn bản hành chính theo từng module, render DOCX/PDF/HTML.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/70_admin_doc_templates.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedAdminDocTemplates() {
  console.log('\n[70] Seeding mẫu văn bản hành chính (M18)...')

  console.log('  → seed_admin_doc_templates.ts')
  execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_admin_doc_templates.ts')}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })

  console.log('[70] Mẫu văn bản hành chính ✓')
}

if (require.main === module) {
  seedAdminDocTemplates().catch(e => { console.error('[70] FAILED:', e.message); process.exit(1) })
}
