/**
 * SEED 54 — Danh mục môn học thật HVHC (M10)
 * Nhóm: DEMO — M10 Education & Training
 * Phụ thuộc: 01_units (Khoa + Bộ môn thật)
 * Phục vụ: danh mục môn học chuẩn (HeSoMonHoc) gắn FK Khoa/Bộ môn
 *
 * LƯU Ý: bước này RESET dữ liệu học tập demo (điểm + enrollment + lớp học phần)
 * rồi nạp lại danh mục môn thật. Đặt CUỐI nhóm M10 để là trạng thái sau cùng.
 * Điểm/enrollment demo sẽ được seed lại theo môn thật ở bước sau (future work).
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/54_mon_hoc.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_mon_hoc_hvhc.ts')

export async function seedMonHoc() {
  console.log('\n[54] Seeding Danh mục môn học thật (M10)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[54] Môn học thật ✓')
}

if (require.main === module) {
  seedMonHoc().catch(e => { console.error('[54] FAILED:', e.message); process.exit(1) })
}
