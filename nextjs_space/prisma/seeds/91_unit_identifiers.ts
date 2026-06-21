/**
 * SEED 91 — Mã định danh điện tử HVHC (QĐ 3843/QĐ-HV)
 * Nhóm: BACKFILL (chạy sau khi mọi đơn vị đã tồn tại — required + realdata)
 * Phụ thuộc: 01_units (+ 07_admin_units, 87_realdata_b212_units nếu có)
 * Tính chất: idempotent, NON-DESTRUCTIVE — đối chiếu + bổ sung, không xóa/đổi dữ liệu cũ
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/91_unit_identifiers.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_unit_identifiers.ts')

export async function seedUnitIdentifiers() {
  console.log('\n[91] Seeding Unit Identifiers — Mã định danh điện tử (QĐ 3843)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[91] Unit Identifiers ✓')
}

if (require.main === module) {
  seedUnitIdentifiers().catch(e => { console.error('[91] FAILED:', e.message); process.exit(1) })
}
