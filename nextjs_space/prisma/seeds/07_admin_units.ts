/**
 * SEED 07 — Administrative Units (Đơn vị hành chính — M19)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: 03_master_data
 * Phục vụ: M19 Master Data — nguồn FK cho Personnel.birthPlace / placeOfOrigin
 *
 * Tạo (model AdministrativeUnit, cây Tỉnh → Quận/Huyện → Phường/Xã):
 *   - PROVINCE: 5 tỉnh/thành chính (Hà Nội, HCM, Đà Nẵng, Hải Phòng, Cần Thơ)
 *   - DISTRICT: quận/huyện của 5 tỉnh trên
 *   - WARD: phường/xã mẫu cho vài quận trọng điểm
 *
 * BẮT BUỘC chạy TRƯỚC 10_personnel (FK nơi sinh / quê quán).
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/07_admin_units.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_administrative_units.ts')

export async function seedAdminUnits() {
  console.log('\n[07] Seeding Administrative Units (M19)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[07] Administrative Units ✓')
}

if (require.main === module) {
  seedAdminUnits().catch(e => { console.error('[07] FAILED:', e.message); process.exit(1) })
}
