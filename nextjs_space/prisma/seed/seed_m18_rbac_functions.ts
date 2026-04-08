/**
 * Seed RBAC function codes for M18 – Template Management & Export Engine
 *
 * 10 function codes, 7 nhóm use case:
 *   VIEW_TEMPLATES, MANAGE_TEMPLATES, PREVIEW_TEMPLATES
 *   EXPORT_DATA, EXPORT_BATCH, VIEW_EXPORT_JOBS, RETRY_EXPORT_JOB
 *   MANAGE_EXPORT_SCHEDULES, VIEW_TEMPLATE_ANALYTICS, IMPORT_TEMPLATES
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m18_rbac_functions.ts
 */

import { PrismaClient, FunctionScope, ActionType } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Function definitions ─────────────────────────────────────────────────────

const M18_FUNCTIONS: Array<{ code: string; name: string; actionType: ActionType }> = [
  { code: 'VIEW_TEMPLATES',            name: 'Xem danh mục / thư viện template',                  actionType: ActionType.VIEW   },
  { code: 'MANAGE_TEMPLATES',          name: 'Quản lý template (CRUD, upload, version, rollback)', actionType: ActionType.UPDATE },
  { code: 'PREVIEW_TEMPLATES',         name: 'Preview template với dữ liệu thực',                 actionType: ActionType.VIEW   },
  { code: 'EXPORT_DATA',               name: 'Xuất file đơn lẻ',                                  actionType: ActionType.EXPORT },
  { code: 'EXPORT_BATCH',              name: 'Xuất hàng loạt (batch export)',                     actionType: ActionType.EXPORT },
  { code: 'VIEW_EXPORT_JOBS',          name: 'Xem lịch sử export jobs',                           actionType: ActionType.VIEW   },
  { code: 'RETRY_EXPORT_JOB',          name: 'Retry export job thất bại',                         actionType: ActionType.UPDATE },
  { code: 'MANAGE_EXPORT_SCHEDULES',   name: 'Quản lý lịch xuất file định kỳ',                   actionType: ActionType.UPDATE },
  { code: 'VIEW_TEMPLATE_ANALYTICS',   name: 'Xem thống kê sử dụng template',                    actionType: ActionType.VIEW   },
  { code: 'IMPORT_TEMPLATES',          name: 'Import template từ file Word/Excel hiện có',        actionType: ActionType.IMPORT },
]

// ─── Position-scope mapping ───────────────────────────────────────────────────

type PS = [string, FunctionScope]

// Xem thư viện template — rộng rãi, hầu hết cán bộ
const VIEW_POSITIONS: PS[] = [
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
  ['CAN_BO_TO_CHUC',    'UNIT'],
  ['QUAN_LY_DAO_TAO',   'DEPARTMENT'],
]

// Quản lý template — chỉ admin và cán bộ nghiệp vụ cấp cao
const MANAGE_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'ACADEMY'],   // Phòng QLKH/Đào tạo quản lý template toàn Học viện
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
]

// Preview với dữ liệu thực — cần load dữ liệu nhân sự thật, giới hạn scope
const PREVIEW_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'DEPARTMENT'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHI_HUY_BO_MON',    'UNIT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
]

// Xuất đơn lẻ — hầu hết cán bộ có thể tự xuất hồ sơ của mình
const EXPORT_DATA_POSITIONS: PS[] = [
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
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['GIANG_VIEN',        'SELF'],
  ['TRO_GIANG',         'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
  ['CAN_BO_TO_CHUC',    'UNIT'],
  ['QUAN_LY_DAO_TAO',   'DEPARTMENT'],
]

// Xuất hàng loạt — chỉ cán bộ quản lý trở lên
const EXPORT_BATCH_POSITIONS: PS[] = [
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
  ['CAN_BO_TO_CHUC',    'UNIT'],
  ['QUAN_LY_DAO_TAO',   'DEPARTMENT'],
]

// Xem lịch sử export jobs
const VIEW_JOBS_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'DEPARTMENT'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['PHO_TRUONG_KHOA',   'DEPARTMENT'],
  ['CHI_HUY_BO_MON',    'UNIT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
  ['PHO_CHU_NHIEM_BM',  'UNIT'],
  ['GIANG_VIEN_CHINH',  'SELF'],
  ['GIANG_VIEN',        'SELF'],
  ['TRO_GIANG',         'SELF'],
  ['NGHIEN_CUU_VIEN',   'SELF'],
  ['CAN_BO_TO_CHUC',    'UNIT'],
  ['QUAN_LY_DAO_TAO',   'DEPARTMENT'],
]

// Retry job thất bại — cần quyền quản lý
const RETRY_JOB_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'DEPARTMENT'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
  ['CHI_HUY_BO_MON',    'UNIT'],
  ['CHU_NHIEM_BO_MON',  'UNIT'],
]

// Quản lý lịch xuất định kỳ — chỉ cán bộ nghiệp vụ cao cấp
const MANAGE_SCHEDULES_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'ACADEMY'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
  ['TRUONG_KHOA',       'DEPARTMENT'],
]

// Xem thống kê analytics — cán bộ quản lý
const VIEW_ANALYTICS_POSITIONS: PS[] = [
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
]

// Import template từ Word/Excel — admin nghiệp vụ
const IMPORT_POSITIONS: PS[] = [
  ['GIAM_DOC',          'ACADEMY'],
  ['PHO_GIAM_DOC',      'ACADEMY'],
  ['SYSTEM_ADMIN',      'ACADEMY'],
  ['TRUONG_PHONG',      'ACADEMY'],
  ['PHO_TRUONG_PHONG',  'DEPARTMENT'],
]

// Map function code → positions
const FUNCTION_POSITION_MAP: Record<string, PS[]> = {
  VIEW_TEMPLATES:           VIEW_POSITIONS,
  MANAGE_TEMPLATES:         MANAGE_POSITIONS,
  PREVIEW_TEMPLATES:        PREVIEW_POSITIONS,
  EXPORT_DATA:              EXPORT_DATA_POSITIONS,
  EXPORT_BATCH:             EXPORT_BATCH_POSITIONS,
  VIEW_EXPORT_JOBS:         VIEW_JOBS_POSITIONS,
  RETRY_EXPORT_JOB:         RETRY_JOB_POSITIONS,
  MANAGE_EXPORT_SCHEDULES:  MANAGE_SCHEDULES_POSITIONS,
  VIEW_TEMPLATE_ANALYTICS:  VIEW_ANALYTICS_POSITIONS,
  IMPORT_TEMPLATES:         IMPORT_POSITIONS,
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seeding M18 RBAC function codes ===\n')

  const positions = await prisma.position.findMany({ select: { id: true, code: true } })
  const positionMap = new Map(positions.map((p) => [p.code, p.id]))

  // Upsert functions
  const functionIdMap = new Map<string, string>()
  for (const fn of M18_FUNCTIONS) {
    const record = await prisma.function.upsert({
      where:  { code: fn.code },
      create: { code: fn.code, name: fn.name, module: 'TEMPLATES', actionType: fn.actionType, isActive: true, isCritical: false },
      update: { name: fn.name, module: 'TEMPLATES', actionType: fn.actionType, isActive: true },
    })
    functionIdMap.set(fn.code, record.id)
    console.log(`  ✓ ${fn.code}`)
  }

  // Create PositionFunction links
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
      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: posId, functionId: fnId },
      })
      if (existing) { skipped++; continue }

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
