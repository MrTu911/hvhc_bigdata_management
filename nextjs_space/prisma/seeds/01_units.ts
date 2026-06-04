/**
 * SEED 01 — Units (Cơ cấu tổ chức đơn vị HVHC)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: Không có
 * Phục vụ: Toàn bộ hệ thống (base entity)
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/01_units.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_units.ts')

export async function seedUnits() {
  console.log('\n[01] Seeding Units — Cơ cấu tổ chức HVHC...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[01] Units ✓')
}

if (require.main === module) {
  seedUnits().catch(e => { console.error('[01] FAILED:', e.message); process.exit(1) })
}
