/**
 * SEED 80 — Big Data Sources (Danh mục nguồn dữ liệu — M12)
 * Nhóm: BIG DATA & HẠ TẦNG
 * Phụ thuộc: 01_units
 * Phục vụ: M12 Khai thác dữ liệu — section "Khai thác dữ liệu" / Data Hub
 *
 * Tạo:
 *   - M19 category: DATA_SOURCE_KIND + DATA_DOMAIN và các item
 *   - DataSource: upsert theo code (idempotent), map ownerUnit theo tên đơn vị
 *
 * Điểm vào của nhóm bigdata.
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/80_bigdata_sources.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_FILE = path.resolve(__dirname, '../seed/seed_bigdata_sources.ts')

export async function seedBigdataSources() {
  console.log('\n[80] Seeding Big Data Sources (M12)...')
  execSync(`npx tsx --require dotenv/config "${SEED_FILE}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })
  console.log('[80] Big Data Sources ✓')
}

if (require.main === module) {
  seedBigdataSources().catch(e => { console.error('[80] FAILED:', e.message); process.exit(1) })
}
