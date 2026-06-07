/**
 * SEED 81 — Infra RBAC (Phân quyền hạ tầng dữ liệu — M12)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 02_positions_functions, 05_rbac_grants
 * Phục vụ: M12 — function codes INFRA + grant theo position
 *
 * Tạo:
 *   - Các INFRA function codes (guarded create) + grant theo position (idempotent)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/81_infra_rbac.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_infra_rbac.ts')

export async function seedInfraRbac() {
  console.log('\n[81] Seeding Infra RBAC (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[81] Infra RBAC ✓')
}

if (require.main === module) {
  seedInfraRbac().catch(e => { console.error('[81] FAILED:', e.message); process.exit(1) })
}
