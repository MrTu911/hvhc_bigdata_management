/**
 * SEED 06 — Commanders (Gán chỉ huy cho từng đơn vị)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: 01_units + 04_users + 02_positions_functions
 * Phục vụ: M01 Auth / M02 Personnel — hiển thị chỉ huy đơn vị
 *
 * Gán User vào vai trò chỉ huy (commanderId) của Unit
 * và tạo UserPosition records tương ứng.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/06_commanders.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/assign_commanders.ts')

export async function seedCommanders() {
  console.log('\n[06] Seeding Commanders...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[06] Commanders ✓')
}

if (require.main === module) {
  seedCommanders().catch(e => { console.error('[06] FAILED:', e.message); process.exit(1) })
}
