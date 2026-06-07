/**
 * SEED 89 — Real Data: Viện B212 RBAC (Dữ liệu THẬT — phân quyền)
 * Nhóm: REALDATA
 * Phụ thuộc: 88_realdata_b212_personnel, 02_positions_functions, 05_rbac_grants
 * Phục vụ: M01/M02 — gán quyền cho 31 cán bộ thật Viện B212
 *
 * Tạo:
 *   - UserPosition / grant cho cán bộ B212 theo chức vụ thật
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/89_realdata_b212_rbac.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_vien_b212_rbac.ts')

export async function seedRealdataB212Rbac() {
  console.log('\n[89] Seeding Real Data — Viện B212 RBAC...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[89] Viện B212 RBAC ✓')
}

if (require.main === module) {
  seedRealdataB212Rbac().catch(e => { console.error('[89] FAILED:', e.message); process.exit(1) })
}
