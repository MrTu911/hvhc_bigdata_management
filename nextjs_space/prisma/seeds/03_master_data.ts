/**
 * SEED 03 — Master Data (68 danh mục lookup — M19)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: Không có (độc lập)
 * Phục vụ: M19 Master Data Platform — tất cả module
 *
 * Tạo 68 danh mục trong 11 nhóm:
 *   MILITARY: Quân hàm, Loại quân nhân, Ngạch lương, Quân khu...
 *   GEOGRAPHY: Tỉnh/Huyện/Xã
 *   EDUCATION: Học hàm, Học vị, Chuyên ngành...
 *   PARTY: Loại tổ chức đảng, Hình thức chuyển đảng...
 *   POLICY: Loại chính sách, Loại trợ cấp...
 *   RESEARCH: Loại đề tài, Lĩnh vực nghiên cứu...
 *   WORKFLOW: Loại quy trình...
 *   ... và nhiều nhóm khác
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/03_master_data.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_master_data.ts')

export async function seedMasterData() {
  console.log('\n[03] Seeding Master Data (M19) — 68 danh mục...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[03] Master Data ✓')
}

if (require.main === module) {
  seedMasterData().catch(e => { console.error('[03] FAILED:', e.message); process.exit(1) })
}
