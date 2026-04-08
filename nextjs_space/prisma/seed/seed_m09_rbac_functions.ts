/**
 * Seed RBAC function codes for M09 Research module (UC-46, UC-47)
 * Adds VIEW_RESEARCH_SCIENTIST, UPDATE_RESEARCH_SCIENTIST, EXPORT_RESEARCH_SCIENTIST,
 *      VIEW_RESEARCH_PUB, CREATE_RESEARCH_PUB, UPDATE_RESEARCH_PUB, DELETE_RESEARCH_PUB,
 *      IMPORT_RESEARCH_PUB, EXPORT_RESEARCH_PUB
 * and assigns them to positions with appropriate scopes.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m09_rbac_functions.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client'

const prisma = new PrismaClient()

// ─── New functions to add ─────────────────────────────────────────────────────

const NEW_FUNCTIONS = [
  // UC-47: Scientist profile
  { code: 'VIEW_RESEARCH_SCIENTIST',   name: 'Xem hồ sơ nhà khoa học',     module: 'RESEARCH', actionType: 'VIEW'   },
  { code: 'UPDATE_RESEARCH_SCIENTIST', name: 'Cập nhật hồ sơ nhà khoa học', module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'EXPORT_RESEARCH_SCIENTIST', name: 'Xuất hồ sơ / bản đồ năng lực', module: 'RESEARCH', actionType: 'EXPORT' },
  // UC-46: Publications
  { code: 'VIEW_RESEARCH_PUB',   name: 'Xem danh sách công bố KH',  module: 'RESEARCH', actionType: 'VIEW'   },
  { code: 'CREATE_RESEARCH_PUB', name: 'Thêm công bố khoa học',      module: 'RESEARCH', actionType: 'CREATE' },
  { code: 'UPDATE_RESEARCH_PUB', name: 'Cập nhật công bố khoa học',  module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'DELETE_RESEARCH_PUB', name: 'Xóa công bố khoa học',       module: 'RESEARCH', actionType: 'DELETE' },
  { code: 'IMPORT_RESEARCH_PUB', name: 'Import BibTeX/Excel công bố', module: 'RESEARCH', actionType: 'IMPORT' },
  { code: 'EXPORT_RESEARCH_PUB', name: 'Xuất danh mục công bố KH',   module: 'RESEARCH', actionType: 'EXPORT' },
]

// ─── Position-to-scope mappings per function ─────────────────────────────────
// Format: [positionCode, scope]
// Mirrors the pattern from VIEW_RESEARCH (broad access) or restricted for write ops.

type PositionScope = [string, FunctionScope]

// Who can VIEW scientist profiles — same broad set as VIEW_RESEARCH
const VIEW_SCIENTIST_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['CHINH_UY',          'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'DEPARTMENT'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHI_HUY_BO_MON',    'UNIT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['PHO_CHU_NHIEM_BM',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'UNIT'],
  ['GIANG_VIEN',        'UNIT'],
  ['TRO_GIANG',         'UNIT'],
  ['NGHIEN_CUU_VIEN',   'UNIT'],
  ['CAN_BO_THU_VIEN',   'ACADEMY'],
]

// Who can UPDATE scientist profiles (owns or manages)
const UPDATE_SCIENTIST_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['PHO_CHU_NHIEM_BM',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['GIANG_VIEN',        'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
]

// Who can EXPORT scientist profiles / capacity map
const EXPORT_SCIENTIST_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
]

// Who can VIEW publications — same broad access
const VIEW_PUB_POSITIONS: PositionScope[] = VIEW_SCIENTIST_POSITIONS

// Who can CREATE publications
const CREATE_PUB_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['PHO_CHU_NHIEM_BM',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['GIANG_VIEN',        'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
]

// Who can UPDATE publications
const UPDATE_PUB_POSITIONS: PositionScope[] = CREATE_PUB_POSITIONS

// Who can DELETE publications
const DELETE_PUB_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['GIANG_VIEN',        'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
]

// Who can IMPORT publications
const IMPORT_PUB_POSITIONS: PositionScope[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
]

// Who can EXPORT publications
const EXPORT_PUB_POSITIONS: PositionScope[] = EXPORT_SCIENTIST_POSITIONS

// Map function code → positions
const FUNCTION_POSITION_MAP: Record<string, PositionScope[]> = {
  VIEW_RESEARCH_SCIENTIST:   VIEW_SCIENTIST_POSITIONS,
  UPDATE_RESEARCH_SCIENTIST: UPDATE_SCIENTIST_POSITIONS,
  EXPORT_RESEARCH_SCIENTIST: EXPORT_SCIENTIST_POSITIONS,
  VIEW_RESEARCH_PUB:         VIEW_PUB_POSITIONS,
  CREATE_RESEARCH_PUB:       CREATE_PUB_POSITIONS,
  UPDATE_RESEARCH_PUB:       UPDATE_PUB_POSITIONS,
  DELETE_RESEARCH_PUB:       DELETE_PUB_POSITIONS,
  IMPORT_RESEARCH_PUB:       IMPORT_PUB_POSITIONS,
  EXPORT_RESEARCH_PUB:       EXPORT_PUB_POSITIONS,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding M09 RBAC function codes ===\n')

  // 1. Load all positions into a lookup map
  const positions = await prisma.position.findMany({ select: { id: true, code: true } })
  const positionMap = new Map(positions.map((p) => [p.code, p.id]))

  // 2. Upsert functions
  const functionIdMap = new Map<string, string>()
  for (const fn of NEW_FUNCTIONS) {
    const created = await prisma.function.upsert({
      where:  { code: fn.code },
      create: { code: fn.code, name: fn.name, module: fn.module, actionType: fn.actionType, isActive: true, isCritical: false },
      update: { name: fn.name, module: fn.module, actionType: fn.actionType, isActive: true },
    })
    functionIdMap.set(fn.code, created.id)
    console.log(`  ✓ Function: ${fn.code} (${created.id})`)
  }

  // 3. Create PositionFunction links
  let created = 0
  let skipped = 0
  for (const [fnCode, posScopes] of Object.entries(FUNCTION_POSITION_MAP)) {
    const fnId = functionIdMap.get(fnCode)
    if (!fnId) continue

    for (const [posCode, scope] of posScopes) {
      const posId = positionMap.get(posCode)
      if (!posId) {
        console.warn(`    ⚠ Position not found: ${posCode}`)
        continue
      }
      // Check if already exists
      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: posId, functionId: fnId },
      })
      if (existing) {
        skipped++
        continue
      }
      await prisma.positionFunction.create({
        data: { positionId: posId, functionId: fnId, scope, isActive: true },
      })
      created++
    }
  }

  console.log(`\n✅ Done: ${created} PositionFunction records created, ${skipped} already existed.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
