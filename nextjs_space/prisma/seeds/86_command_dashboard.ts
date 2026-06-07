/**
 * SEED 86 — Command Dashboard (Dashboard chỉ huy — M11)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 04_users, 10_personnel
 * Phục vụ: M11 Dashboard / BI — dữ liệu tổng hợp cho dashboard chỉ huy
 *
 * Tạo:
 *   - Dữ liệu tổng hợp / widget cache cho dashboard chỉ huy
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/86_command_dashboard.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_command_dashboard.ts')

export async function seedCommandDashboard() {
  console.log('\n[86] Seeding Command Dashboard (M11)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[86] Command Dashboard ✓')
}

if (require.main === module) {
  seedCommandDashboard().catch(e => { console.error('[86] FAILED:', e.message); process.exit(1) })
}
