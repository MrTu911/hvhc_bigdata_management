/**
 * seed_science_rbac.ts
 *
 * Seeds ALL 28 SCIENCE function codes (Phases 1–8 + Attachments) và cấp quyền theo chức vụ.
 *
 * Chức năng:
 *   1. Upsert 28 Function records cho module SCIENCE
 *   2. Upsert PositionFunction links cho từng chức vụ liên quan
 *   3. Cấp toàn quyền SCIENCE cho SYSTEM_ADMIN + GIAM_DOC
 *
 * Idempotent — chạy lại an toàn nhiều lần.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_science_rbac.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// ─── 1. Function definitions ──────────────────────────────────────────────────

interface FnDef {
  code: string
  name: string
  actionType: string
  isCritical?: boolean
}

const SCIENCE_FUNCTIONS: FnDef[] = [
  // ── Catalog (Phase 1) ─────────────────────────────────────────────────────
  { code: 'VIEW_SCIENCE_CATALOG',   name: 'Xem danh mục KHQL (lĩnh vực, loại, nguồn)',      actionType: 'VIEW'   },
  { code: 'MANAGE_SCIENCE_CATALOG', name: 'Quản lý danh mục KHQL',                           actionType: 'UPDATE', isCritical: false },

  // ── Scientist profile (Phase 2) ───────────────────────────────────────────
  { code: 'VIEW_SCIENTIST_PROFILE',   name: 'Xem hồ sơ nhà khoa học',                        actionType: 'VIEW'   },
  { code: 'MANAGE_SCIENTIST_PROFILE', name: 'Cập nhật hồ sơ nhà khoa học',                   actionType: 'UPDATE' },
  { code: 'SYNC_ORCID',              name: 'Đồng bộ ORCID cho nhà khoa học',                 actionType: 'UPDATE' },

  // ── Projects (Phase 3) ────────────────────────────────────────────────────
  { code: 'CREATE_RESEARCH_PROJECT',   name: 'Tạo đề tài NCKH mới',                          actionType: 'CREATE' },
  { code: 'APPROVE_RESEARCH_DEPT',     name: 'Phê duyệt đề tài NCKH cấp phòng/khoa',         actionType: 'APPROVE' },
  { code: 'APPROVE_RESEARCH_ACADEMY',  name: 'Phê duyệt đề tài NCKH cấp học viện',           actionType: 'APPROVE', isCritical: true },

  // ── Scientific works (Phase 3) ────────────────────────────────────────────
  { code: 'CREATE_SCIENTIFIC_WORK', name: 'Tạo công trình KH (sách, giáo trình)',             actionType: 'CREATE' },
  { code: 'IMPORT_FROM_CROSSREF',   name: 'Import công trình từ CrossRef/DOI',                actionType: 'IMPORT' },

  // ── Library (Phase 4) ────────────────────────────────────────────────────
  { code: 'UPLOAD_LIBRARY',           name: 'Upload tài liệu vào thư viện số',                actionType: 'CREATE' },
  { code: 'DOWNLOAD_LIBRARY_NORMAL',  name: 'Tải tài liệu thường (NORMAL/CONFIDENTIAL)',       actionType: 'VIEW'   },
  { code: 'DOWNLOAD_LIBRARY_SECRET',  name: 'Tải tài liệu mật (SECRET)',                      actionType: 'VIEW',   isCritical: true },

  // ── Budget (Phase 5) ─────────────────────────────────────────────────────
  { code: 'MANAGE_RESEARCH_BUDGET', name: 'Quản lý dự toán kinh phí NCKH',                   actionType: 'UPDATE' },
  { code: 'APPROVE_BUDGET',         name: 'Phê duyệt kinh phí NCKH',                         actionType: 'APPROVE', isCritical: true },
  { code: 'VIEW_BUDGET_FINANCE',    name: 'Xem chi tiết tài chính dự toán NCKH',              actionType: 'VIEW'   },

  // ── Council (Phase 5) ────────────────────────────────────────────────────
  { code: 'MANAGE_COUNCIL',      name: 'Thành lập và quản lý hội đồng KH',                   actionType: 'UPDATE' },
  { code: 'SUBMIT_REVIEW',       name: 'Nộp phản biện (thành viên hội đồng)',                 actionType: 'SUBMIT' },
  { code: 'FINALIZE_ACCEPTANCE', name: 'Kết luận nghiệm thu hội đồng KH',                    actionType: 'APPROVE', isCritical: true },

  // ── Dashboard + Search + Reports (Phase 6–7) ─────────────────────────────
  { code: 'VIEW_SCIENCE_DASHBOARD', name: 'Xem dashboard KHQL',                               actionType: 'VIEW'   },
  { code: 'USE_SCIENCE_SEARCH',     name: 'Tìm kiếm thông minh KHQL',                        actionType: 'VIEW'   },
  { code: 'EXPORT_SCIENCE_REPORT',  name: 'Xuất báo cáo BQP về NCKH',                        actionType: 'EXPORT' },

  // ── AI (Phase 8) ─────────────────────────────────────────────────────────
  { code: 'USE_AI_SCIENCE',       name: 'Sử dụng AI trợ lý KHQL (chatbot, tìm kiếm)',        actionType: 'VIEW'   },
  { code: 'USE_AI_SCIENCE_ADMIN', name: 'Quản trị AI KHQL (config, quality monitoring)',      actionType: 'UPDATE', isCritical: false },

  // ── File Minh Chứng / Attachments (Phase 6) ──────────────────────────────
  { code: 'VIEW_SCIENCE_ATTACHMENT',   name: 'Xem tài liệu minh chứng đề tài/công bố',       actionType: 'VIEW'   },
  { code: 'UPLOAD_SCIENCE_ATTACHMENT', name: 'Tải lên tài liệu minh chứng đề tài/công bố',   actionType: 'CREATE' },
  { code: 'DELETE_SCIENCE_ATTACHMENT', name: 'Xóa tài liệu minh chứng đề tài/công bố',       actionType: 'DELETE', isCritical: false },
]

// ─── 2. Position → function grant mapping ─────────────────────────────────────
// Format: { positionCode, functionCode, scope }

type Grant = { positionCode: string; functionCode: string; scope: FunctionScope }

/**
 * Tạo danh sách cấp quyền cho từng chức vụ.
 *
 * Nguyên tắc phân quyền SCIENCE:
 *   - Academy leadership (GIAM_DOC, PHO_GIAM_DOC, CHINH_UY): toàn quyền ACADEMY scope
 *   - TRUONG_PHONG (Phòng KHCN): quản lý toàn bộ NCKH trừ tài liệu mật và AI admin, DEPARTMENT scope
 *   - PHO_TRUONG_PHONG: như TRUONG_PHONG nhưng không MANAGE_CATALOG, DEPARTMENT scope
 *   - TRUONG_KHOA / PHO_TRUONG_KHOA: quản lý NCKH trong khoa, DEPARTMENT scope
 *   - CHU_NHIEM_BO_MON / CHI_HUY_BO_MON: quản lý NCKH trong bộ môn, UNIT scope
 *   - PHO_CHU_NHIEM_BM: hỗ trợ bộ môn, UNIT scope
 *   - GIANG_VIEN_CHINH: nghiên cứu viên chính, SELF + UNIT library
 *   - GIANG_VIEN: nghiên cứu cơ bản, SELF
 *   - NGHIEN_CUU_VIEN: nghiên cứu chuyên trách, SELF + UNIT
 *   - TRO_GIANG: hỗ trợ giảng dạy, view-only
 *   - CAN_BO_THU_VIEN: quản lý thư viện số, library-focused
 *   - TRO_LY / NHAN_VIEN: view dashboard + search
 *   - SYSTEM_ADMIN: toàn quyền ACADEMY (tất cả 25 functions)
 */
function buildGrants(): Grant[] {
  const all = SCIENCE_FUNCTIONS.map((f) => f.code)

  // Academy-level full access (ban giám đốc + chính ủy)
  const academyFullAccess = all

  // Phòng KHCN (TRUONG_PHONG): quản lý toàn bộ trừ tài liệu mật và AI admin
  const truongPhongAccess = all.filter(
    (c) => !['DOWNLOAD_LIBRARY_SECRET', 'USE_AI_SCIENCE_ADMIN', 'APPROVE_RESEARCH_ACADEMY'].includes(c),
  )
  // Note: VIEW/UPLOAD/DELETE_SCIENCE_ATTACHMENT are included in `all`, so academy/truong_phong get them automatically

  // PHO_TRUONG_PHONG: như TRUONG_PHONG nhưng không quản lý danh mục
  const phoTruongPhongAccess = truongPhongAccess.filter((c) => c !== 'MANAGE_SCIENCE_CATALOG')

  // TRUONG_KHOA: quản lý NCKH trong khoa (không approve academy, không approve budget, không secret)
  const truongKhoaAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'CREATE_RESEARCH_PROJECT',
    'APPROVE_RESEARCH_DEPT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'MANAGE_RESEARCH_BUDGET',
    'VIEW_BUDGET_FINANCE',
    'MANAGE_COUNCIL',
    'SUBMIT_REVIEW',
    'FINALIZE_ACCEPTANCE',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'EXPORT_SCIENCE_REPORT',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
    'DELETE_SCIENCE_ATTACHMENT',
  ]

  // PHO_TRUONG_KHOA: như TRUONG_KHOA nhưng không FINALIZE_ACCEPTANCE
  const phoTruongKhoaAccess = truongKhoaAccess.filter((c) => c !== 'FINALIZE_ACCEPTANCE')

  // CHU_NHIEM_BO_MON / CHI_HUY_BO_MON: quản lý bộ môn
  const chuNhiemBoMonAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'SYNC_ORCID',
    'CREATE_RESEARCH_PROJECT',
    'APPROVE_RESEARCH_DEPT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'MANAGE_RESEARCH_BUDGET',
    'VIEW_BUDGET_FINANCE',
    'MANAGE_COUNCIL',
    'SUBMIT_REVIEW',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'EXPORT_SCIENCE_REPORT',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
    'DELETE_SCIENCE_ATTACHMENT',
  ]

  // PHO_CHU_NHIEM_BM: hỗ trợ bộ môn (không APPROVE_DEPT, không MANAGE_COUNCIL)
  const phoChuNhiemBMAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'SYNC_ORCID',
    'CREATE_RESEARCH_PROJECT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_BUDGET_FINANCE',
    'SUBMIT_REVIEW',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
  ]

  // GIANG_VIEN_CHINH: nghiên cứu viên chính — SELF scope cho profile/project/work
  const giangVienChinhAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'SYNC_ORCID',
    'CREATE_RESEARCH_PROJECT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_BUDGET_FINANCE',
    'SUBMIT_REVIEW',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
  ]

  // GIANG_VIEN: cơ bản
  const giangVienAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'SYNC_ORCID',
    'CREATE_RESEARCH_PROJECT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'SUBMIT_REVIEW',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
  ]

  // TRO_GIANG: view + search chỉ
  const troGiangAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
  ]

  // NGHIEN_CUU_VIEN: chuyên nghiên cứu
  const nghienCuuVienAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'MANAGE_SCIENTIST_PROFILE',
    'SYNC_ORCID',
    'CREATE_RESEARCH_PROJECT',
    'CREATE_SCIENTIFIC_WORK',
    'IMPORT_FROM_CROSSREF',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_BUDGET_FINANCE',
    'SUBMIT_REVIEW',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'EXPORT_SCIENCE_REPORT',
    'USE_AI_SCIENCE',
    'VIEW_SCIENCE_ATTACHMENT',
    'UPLOAD_SCIENCE_ATTACHMENT',
  ]

  // CAN_BO_THU_VIEN: thư viện
  const canBoThuVienAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'UPLOAD_LIBRARY',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'VIEW_SCIENCE_ATTACHMENT',
  ]

  // TRO_LY / NHAN_VIEN: hỗ trợ nghiệp vụ, view only
  const troLyAccess = [
    'VIEW_SCIENCE_CATALOG',
    'VIEW_SCIENTIST_PROFILE',
    'DOWNLOAD_LIBRARY_NORMAL',
    'VIEW_SCIENCE_DASHBOARD',
    'USE_SCIENCE_SEARCH',
    'VIEW_SCIENCE_ATTACHMENT',
  ]

  const grants: Grant[] = []

  function add(positionCode: string, codes: string[], scope: FunctionScope) {
    for (const functionCode of codes) {
      grants.push({ positionCode, functionCode, scope })
    }
  }

  // Admin: all, ACADEMY
  add('SYSTEM_ADMIN', all, 'ACADEMY')

  // Academy leadership: all, ACADEMY
  add('GIAM_DOC',     academyFullAccess, 'ACADEMY')
  add('PHO_GIAM_DOC', academyFullAccess, 'ACADEMY')
  add('CHINH_UY',     academyFullAccess, 'ACADEMY')

  // Phòng KHCN (multiple Truong Phong codes in DB)
  add('TRUONG_PHONG_KHOA_HOC', truongPhongAccess,    'DEPARTMENT')
  add('B1_TRUONG_PHONG',        truongPhongAccess,    'DEPARTMENT')
  add('B2_TRUONG_PHÒNG',        truongPhongAccess,    'DEPARTMENT')
  add('TRUONG_PHONG_DAO_TAO',   truongPhongAccess,    'DEPARTMENT')
  add('TRUONG_PHONG_NHAN_SU',   truongPhongAccess,    'DEPARTMENT')
  add('TRUONG_PHONG_CHINH_SACH',truongPhongAccess,    'DEPARTMENT')
  add('TRUONG_PHONG_DANG',      truongPhongAccess,    'DEPARTMENT')
  add('PHO_TRUONG_PHONG',       phoTruongPhongAccess, 'DEPARTMENT')

  // Khoa/Phòng (faculty)
  add('TRUONG_KHOA',     truongKhoaAccess,    'DEPARTMENT')
  add('PHO_TRUONG_KHOA', phoTruongKhoaAccess, 'DEPARTMENT')

  // Bộ môn (subject group)
  add('CHU_NHIEM_BO_MON', chuNhiemBoMonAccess, 'UNIT')
  add('CHI_HUY_BO_MON',   chuNhiemBoMonAccess, 'UNIT')
  add('PHO_CHU_NHIEM_BM', phoChuNhiemBMAccess, 'UNIT')

  // Giảng viên / Nghiên cứu viên
  add('GIANG_VIEN_CHINH', giangVienChinhAccess, 'UNIT')
  add('GIANG_VIEN',       giangVienAccess,      'SELF')
  add('TRO_GIANG',        troGiangAccess,       'SELF')
  add('NGHIEN_CUU_VIEN',  nghienCuuVienAccess,  'UNIT')

  // Thư viện
  add('CAN_BO_THU_VIEN', canBoThuVienAccess, 'ACADEMY')

  // Hỗ trợ
  add('TRO_LY',    troLyAccess, 'UNIT')
  add('NHAN_VIEN', troLyAccess, 'UNIT')

  return grants
}

// ─── 3. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Seed SCIENCE RBAC (Phases 1–8) ===\n')

  // Step 1: Upsert Function records
  console.log('📌 Step 1: Upsert Function records...')
  const functionIdMap = new Map<string, string>()

  for (const fn of SCIENCE_FUNCTIONS) {
    const record = await prisma.function.upsert({
      where: { code: fn.code },
      create: {
        code:       fn.code,
        name:       fn.name,
        module:     'science',
        actionType: fn.actionType as never,
        isActive:   true,
        isCritical: fn.isCritical ?? false,
      },
      update: {
        name:       fn.name,
        module:     'science',
        actionType: fn.actionType as never,
        isActive:   true,
        isCritical: fn.isCritical ?? false,
      },
    })
    functionIdMap.set(fn.code, record.id)
    console.log(`  ✓ ${fn.code}`)
  }

  console.log(`\n  Tổng: ${SCIENCE_FUNCTIONS.length} function codes\n`)

  // Step 2: Load positions
  console.log('📌 Step 2: Load positions...')
  const positions = await prisma.position.findMany({ select: { id: true, code: true } })
  const positionMap = new Map(positions.map((p) => [p.code, p.id]))
  const missingPositions = new Set<string>()

  // Step 3: Upsert PositionFunction grants
  console.log('📌 Step 3: Assign PositionFunction grants...')
  const grants = buildGrants()

  let created = 0, updated = 0, skippedPos = 0

  for (const grant of grants) {
    const posId = positionMap.get(grant.positionCode)
    const fnId  = functionIdMap.get(grant.functionCode)

    if (!posId) {
      if (!missingPositions.has(grant.positionCode)) {
        console.warn(`  ⚠ Position not found: ${grant.positionCode}`)
        missingPositions.add(grant.positionCode)
      }
      skippedPos++
      continue
    }
    if (!fnId) continue // shouldn't happen since we just upserted all

    const existing = await prisma.positionFunction.findFirst({
      where: { positionId: posId, functionId: fnId },
    })

    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId: posId,
          functionId: fnId,
          scope:      grant.scope,
          isActive:   true,
        },
      })
      created++
    } else if (existing.scope !== grant.scope || !existing.isActive) {
      // Update scope if it changed (e.g. someone re-ran with a corrected mapping)
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: { scope: grant.scope, isActive: true },
      })
      updated++
    }
  }

  console.log(`\n  ✓ Created: ${created}`)
  console.log(`  ⏩ Updated: ${updated}`)
  if (skippedPos > 0) console.log(`  ⚠ Skipped (position missing): ${skippedPos}`)

  // Step 4: Ensure SYSTEM_ADMIN has ALL SCIENCE functions (extra safety pass)
  console.log('\n📌 Step 4: Ensure SYSTEM_ADMIN + GIAM_DOC full SCIENCE access...')
  const adminPositions = ['SYSTEM_ADMIN', 'GIAM_DOC', 'PHO_GIAM_DOC']

  for (const posCode of adminPositions) {
    const posId = positionMap.get(posCode)
    if (!posId) {
      console.warn(`  ⚠ ${posCode} position not found — skipping`)
      continue
    }
    let adminCreated = 0
    for (const [fnCode, fnId] of Array.from(functionIdMap.entries())) {
      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: posId, functionId: fnId },
      })
      if (!existing) {
        await prisma.positionFunction.create({
          data: { positionId: posId, functionId: fnId, scope: 'ACADEMY', isActive: true },
        })
        adminCreated++
      }
    }
    if (adminCreated > 0) console.log(`  ✓ ${posCode}: ${adminCreated} thêm mới`)
    else console.log(`  ⏩ ${posCode}: đã đầy đủ`)
  }

  // Step 5: Summary
  console.log('\n=== SCIENCE RBAC Summary ===')
  console.log(`Functions seeded : ${SCIENCE_FUNCTIONS.length}`)
  console.log(`Grants processed : ${grants.length}`)
  console.log(`Positions covered: ${Array.from(new Set(grants.map((g) => g.positionCode))).join(', ')}`)
  console.log('\n✅ Done!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
