/**
 * SEED 20 — Party Organizations (Tổ chức Đảng — M03)
 * Nhóm: DEMO — M03 Party Management
 * Phụ thuộc: 01_units, 04_users
 * Phục vụ: M03 Party Management
 *
 * Tạo:
 *   - PartyOrganization: Đảng ủy, Chi bộ theo từng đơn vị
 *   - Cây tổ chức Đảng gắn với Unit
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/20_party_organizations.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

export async function seedPartyOrganizations() {
  console.log('\n[20] Seeding Party Organizations (M03)...')

  console.log('  → seed_party_organizations.ts')
  execSync(`npx tsx --require dotenv/config "${path.join(SEED_DIR, 'seed_party_organizations.ts')}"`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  })

  console.log('[20] Party Organizations ✓')
}

if (require.main === module) {
  seedPartyOrganizations().catch(e => { console.error('[20] FAILED:', e.message); process.exit(1) })
}
