/**
 * SEED 84 — Infrastructure Demo (NAS / GPU / Backup — M12)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 04_users (cần admin role QUAN_TRI_HE_THONG)
 * Phục vụ: M12 — cấu hình hạ tầng demo + nhật ký đồng bộ
 *
 * Tạo:
 *   - InfrastructureConfig: NAS chính, NAS backup, GPU server, dev server, backup server
 *   - SyncLog: nhật ký đồng bộ (idempotent — xóa log demo cũ rồi tạo lại)
 *
 * Bảo mật: credential demo lấy từ env (DEMO_NAS_PASSWORD / DEMO_SERVER_PASSWORD),
 * không hard-code; chỉ lưu bản băm bcrypt.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/84_infrastructure_demo.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_infrastructure_demo.ts')

export async function seedInfrastructureDemo() {
  console.log('\n[84] Seeding Infrastructure Demo (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[84] Infrastructure Demo ✓')
}

if (require.main === module) {
  seedInfrastructureDemo().catch(e => { console.error('[84] FAILED:', e.message); process.exit(1) })
}
