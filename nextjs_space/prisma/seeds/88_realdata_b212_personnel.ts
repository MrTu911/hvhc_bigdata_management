/**
 * SEED 88 — Real Data: Viện B212 Personnel (Dữ liệu THẬT — 31 cán bộ)
 * Nhóm: REALDATA
 * Phụ thuộc: 87_realdata_b212_units
 * Phục vụ: M02 — import 31 cán bộ thật của Viện B212 vào model User
 *
 * Tạo:
 *   - 31 cán bộ thật từ prisma/seed/data/vien_b212_personnel.json
 *   - Idempotent: upsert theo email ổn định suy từ STT (chạy lại không nhân đôi)
 *
 * Tiền đề: cột schema mới (bloodGroupRaw, citizenIdIssueDate/IssuePlace/ExpiryDate)
 * đã có trong DB.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/88_realdata_b212_personnel.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_vien_b212_personnel.ts')

export async function seedRealdataB212Personnel() {
  console.log('\n[88] Seeding Real Data — Viện B212 Personnel (31 cán bộ)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[88] Viện B212 Personnel ✓')
}

if (require.main === module) {
  seedRealdataB212Personnel().catch(e => { console.error('[88] FAILED:', e.message); process.exit(1) })
}
