/**
 * SEED 02 — Positions & Functions (Chức vụ + Function codes RBAC)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: Không có (độc lập với Units)
 * Phục vụ: M01 Auth / RBAC — tất cả module
 *
 * Tạo:
 *   - 20+ chức vụ (Position): Giám đốc, Trưởng khoa, Giảng viên, Học viên...
 *   - 65+ function codes (Function): VIEW_PERSONNEL, CREATE_STUDENT, APPROVE_RESEARCH...
 *   - PositionFunction grants mặc định theo chức vụ
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/02_positions_functions.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_positions_rbac.ts')

export async function seedPositionsAndFunctions() {
  console.log('\n[02] Seeding Positions & Functions...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[02] Positions & Functions ✓')
}

if (require.main === module) {
  seedPositionsAndFunctions().catch(e => { console.error('[02] FAILED:', e.message); process.exit(1) })
}
