/**
 * SEED 92 — Backfill gán đơn vị THEO VAI TRÒ cho mọi hồ sơ còn trống (CORE)
 * Nhóm: BACKFILL — chạy CUỐI cùng (sau cả dữ liệu thật B212).
 * Phụ thuộc: toàn bộ seed nhân sự/học viên đã chạy.
 *
 * Lưu ý: trong orchestrator luôn chạy với --apply (ghi thật). Xem dry-run bằng cách
 * chạy trực tiếp prisma/seed/backfill_assign_unassigned_units.ts không kèm --apply.
 *
 * Chạy độc lập: npx tsx --require dotenv/config prisma/seeds/92_assign_units_backfill.ts
 */
import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/backfill_assign_unassigned_units.ts')

export async function seedAssignUnitsBackfill() {
  console.log('\n[92] Backfill gán đơn vị theo vai trò (apply)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}" --apply`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[92] Assign units backfill ✓')
}

if (require.main === module) {
  seedAssignUnitsBackfill().catch((e) => {
    console.error('[92] FAILED:', e.message)
    process.exit(1)
  })
}
