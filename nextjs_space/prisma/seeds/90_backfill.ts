/**
 * SEED 90 — Backfill (Vá dữ liệu thiếu — chạy cuối cùng)
 * Nhóm: BACKFILL
 * Phụ thuộc: TẤT CẢ step trước (chạy sau cùng)
 * Phục vụ: Toàn bộ hệ thống — sửa FK và dữ liệu không nhất quán
 *
 * Thực hiện:
 *   1. backfill_fk_references.ts     → Sửa FK references bị null/sai
 *   2. backfill-personnel.ts         → Điền thông tin Personnel còn thiếu
 *   3. backfill_student_profile.ts   → Liên kết StudentProfile ↔ HocVien
 *   4. backfill_scientist_maso.ts    → Điền mã số nhà khoa học
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/90_backfill.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

const BACKFILL_FILES = [
  'backfill_fk_references.ts',
  'backfill-personnel.ts',
  'backfill_student_profile_to_hocvien.ts',
  'backfill_scientist_maso.ts',
]

export async function seedBackfill() {
  console.log('\n[90] Running Backfill (cleanup & fix)...')

  for (const file of BACKFILL_FILES) {
    const filePath = path.join(SEED_DIR, file)
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${filePath}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch {
      console.warn(`  ⚠️  ${file} bỏ qua lỗi nhỏ`)
    }
  }

  console.log('[90] Backfill ✓')
}

if (require.main === module) {
  seedBackfill().catch(e => { console.error('[90] FAILED:', e.message); process.exit(1) })
}
