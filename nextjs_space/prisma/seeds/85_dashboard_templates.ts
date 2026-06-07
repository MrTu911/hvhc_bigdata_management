/**
 * SEED 85 — Dashboard Role Templates (Mẫu bố cục dashboard — M11)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 02_positions_functions
 * Phục vụ: M11 Dashboard / BI — bố cục mặc định theo vai trò
 *
 * Tạo (model DashboardRoleTemplate) cho 6 role:
 *   EXECUTIVE, DEPARTMENT, EDUCATION, PARTY, FACULTY, STUDENT
 *   (layout grid 12 cột: { widgetId, x, y, w, h })
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/85_dashboard_templates.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_m11_dashboard_templates.ts')

export async function seedDashboardTemplates() {
  console.log('\n[85] Seeding Dashboard Role Templates (M11)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[85] Dashboard Role Templates ✓')
}

if (require.main === module) {
  seedDashboardTemplates().catch(e => { console.error('[85] FAILED:', e.message); process.exit(1) })
}
