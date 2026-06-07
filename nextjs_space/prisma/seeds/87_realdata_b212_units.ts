/**
 * SEED 87 — Real Data: Viện B212 Units (Dữ liệu THẬT — 4 Ban)
 * Nhóm: REALDATA
 * Phụ thuộc: 01_units (đơn vị Viện 'B12' phải tồn tại)
 * Phục vụ: M02 — import đơn vị thật của Viện Nghiên cứu Khoa học Hậu cần Quân sự
 *
 * Tạo:
 *   - 4 Ban con (level 3, parent = B12) — upsert theo Unit.code, NON-DESTRUCTIVE
 *     (KHÔNG đụng tới đơn vị khác; khác hẳn seed_units.ts step 01 vốn wipe toàn bộ Unit).
 *
 * Lưu ý: nhóm realdata chỉ chạy trong cùng một lượt 'all' SAU step 01, hoặc
 * chạy riêng bằng 'npm run seed:realdata'. KHÔNG chạy lại step 01 sau khi đã có B212.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/87_realdata_b212_units.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_vien_b212_units.ts')

export async function seedRealdataB212Units() {
  console.log('\n[87] Seeding Real Data — Viện B212 Units (4 Ban)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[87] Viện B212 Units ✓')
}

if (require.main === module) {
  seedRealdataB212Units().catch(e => { console.error('[87] FAILED:', e.message); process.exit(1) })
}
