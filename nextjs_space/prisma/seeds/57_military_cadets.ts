/**
 * SEED 57 — Học viên quân sự (không sĩ quan) → đại đội thuộc tiểu đoàn (M10)
 * Nhóm: DEMO — M10 Đào tạo
 * Phụ thuộc: 01_units (DAI_DOI/TIEU_DOAN), 02_positions_functions (HOC_VIEN_QUAN_SU)
 * Phục vụ: M10 Education — tài khoản học viên hệ chỉ huy, cơ cấu tiểu đoàn/đại đội
 *
 * Tạo:
 *   - User (role HOC_VIEN, personnelType HOC_VIEN_QUAN_SU, cấp bậc HSQ/chiến sĩ)
 *   - UserPosition (HOC_VIEN_QUAN_SU — scope SELF) để lấy quyền RBAC
 *   - HocVien liên kết userId, gán battalionUnitId + daiDoi (đại đội thuộc tiểu đoàn)
 *
 * Cấu hình: CADETS_PER_COMPANY (env, mặc định 10).
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/57_military_cadets.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_military_cadets.ts')

export async function seedMilitaryCadets() {
  console.log('\n[57] Seeding học viên quân sự (không sĩ quan) → đại đội/tiểu đoàn (M10)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[57] Military Cadets ✓')
}

if (require.main === module) {
  seedMilitaryCadets().catch((e) => {
    console.error('[57] FAILED:', e.message)
    process.exit(1)
  })
}
