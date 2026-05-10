/**
 * SEED 05 — RBAC Grants (Phân quyền cho tất cả module)
 * Nhóm: BẮT BUỘC
 * Phụ thuộc: 02_positions_functions (Position + Function phải có trước)
 *             04_users (User phải có trước)
 * Phục vụ: M01 Auth RBAC — tất cả module
 *
 * Gộp 7 file RBAC theo thứ tự:
 *   1. seed_admin_full_access.ts      → Admin full access grants
 *   2. seed_m01_m02_m03_permissions.ts → M01/M02/M03 permission grants
 *   3. seed_party_insurance_perms.ts  → M03 Party + M07 Insurance perms
 *   4. seed_m09_rbac_functions.ts     → M09 Research functions
 *   5. seed_m10_rbac_functions.ts     → M10 Education functions
 *   6. seed_m13_workflow_functions.ts → M13 Workflow functions
 *   7. seed_m18_rbac_functions.ts     → M18 Export functions
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seeds/05_rbac_grants.ts
 */

import { execSync } from 'child_process'
import path from 'path'

const SEED_DIR = path.resolve(__dirname, '../seed')

const RBAC_FILES = [
  'seed_admin_full_access.ts',
  'seed_m01_m02_m03_permissions.ts',
  'seed_party_insurance_perms.ts',
  'seed_m09_rbac_functions.ts',
  'seed_m10_rbac_functions.ts',
  'seed_m13_workflow_functions.ts',
  'seed_m18_rbac_functions.ts',
]

export async function seedRbacGrants() {
  console.log('\n[05] Seeding RBAC Grants (7 files)...')

  for (const file of RBAC_FILES) {
    const filePath = path.resolve(SEED_DIR, file)
    console.log(`  → ${file}`)
    try {
      execSync(`npx tsx --require dotenv/config "${filePath}"`, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
      })
    } catch (err) {
      // Một số file RBAC có thể bỏ qua nếu function code chưa tồn tại
      console.warn(`  ⚠️  ${file} có lỗi (bỏ qua):`, (err as Error).message?.split('\n')[0])
    }
  }

  console.log('[05] RBAC Grants ✓')
}

if (require.main === module) {
  seedRbacGrants().catch(e => { console.error('[05] FAILED:', e.message); process.exit(1) })
}
