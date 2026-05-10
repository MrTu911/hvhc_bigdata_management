/**
 * SEED 04 — Users (Tài khoản người dùng demo)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: 01_units (User.unitId → Unit)
 * Phục vụ: M01 Auth — tất cả module
 *
 * Tạo 50+ tài khoản từ hvhc_personnel.json:
 *   - Admin: admin@hvhc.edu.vn
 *   - Giám đốc, Chính ủy, Phó GĐ
 *   - Trưởng khoa, Trưởng phòng, Trưởng bộ môn
 *   - Giảng viên các khoa
 *   - Nghiên cứu viên
 *   - Học viên (quân sự + dân sự)
 *   Mật khẩu mặc định: Hv@2025
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/04_users.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_users.ts')

export async function seedUsers() {
  console.log('\n[04] Seeding Users...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[04] Users ✓')
}

if (require.main === module) {
  seedUsers().catch(e => { console.error('[04] FAILED:', e.message); process.exit(1) })
}
