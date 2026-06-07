/**
 * SEED 71 — Science RBAC (Phân quyền miền khoa học M20–M26)
 * Nhóm: DEMO — M20 Science
 * Phụ thuộc: 02_positions_functions, 05_rbac_grants
 * Phục vụ: M20–M26 — function codes + grants cho miền nghiên cứu khoa học
 *
 * Tạo:
 *   - Các SCIENCE function codes (upsert) + grant theo position (idempotent)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/71_science_rbac.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_science_rbac.ts')

export async function seedScienceRbac() {
  console.log('\n[71] Seeding Science RBAC (M20–M26)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[71] Science RBAC ✓')
}

if (require.main === module) {
  seedScienceRbac().catch(e => { console.error('[71] FAILED:', e.message); process.exit(1) })
}
