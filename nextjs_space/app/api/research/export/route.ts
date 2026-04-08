/**
 * Research data export – Phase 6.
 * GET /api/research/export?type=projects|scientists|publications&...filters
 * Returns XLSX file.
 */
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Label maps ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện',
  CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ Quốc phòng',
  CAP_NHA_NUOC: 'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở',
}

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI: 'KHXH & NV',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT: 'CNTT',
  Y_DUOC: 'Y dược',
  KHAC: 'Khác',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã phê duyệt',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
}

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
}

function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return ''
  return map[key] ?? key
}

function fmt(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('vi-VN')
}

// ─── Sheet builders ───────────────────────────────────────────────────────────

async function buildProjectsSheet() {
  const projects = await prisma.nckhProject.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2000,
    select: {
      projectCode: true,
      title: true,
      category: true,
      field: true,
      researchType: true,
      status: true,
      phase: true,
      startDate: true,
      endDate: true,
      budgetRequested: true,
      budgetApproved: true,
      budgetUsed: true,
      budgetYear: true,
      principalInvestigator: { select: { name: true, rank: true } },
      unit: { select: { name: true } },
      _count: { select: { members: true, milestones: true, publications: true } },
    },
  })

  const rows = projects.map((p) => ({
    'Mã đề tài': p.projectCode,
    'Tên đề tài': p.title,
    'Cấp': label(CATEGORY_LABELS, p.category),
    'Lĩnh vực': label(FIELD_LABELS, p.field),
    'Loại nghiên cứu': p.researchType ?? '',
    'Trạng thái': label(STATUS_LABELS, p.status),
    'Giai đoạn': p.phase ?? '',
    'Chủ nhiệm': p.principalInvestigator?.name ?? '',
    'Quân hàm': p.principalInvestigator?.rank ?? '',
    'Đơn vị': p.unit?.name ?? '',
    'Năm ngân sách': p.budgetYear ?? '',
    'Kinh phí yêu cầu (tr.đ)': p.budgetRequested?.toString() ?? '',
    'Kinh phí phê duyệt (tr.đ)': p.budgetApproved?.toString() ?? '',
    'Kinh phí thực tế (tr.đ)': p.budgetUsed?.toString() ?? '',
    'Ngày bắt đầu': fmt(p.startDate),
    'Ngày kết thúc dự kiến': fmt(p.endDate),
    'Số thành viên': p._count.members,
    'Số mốc tiến độ': p._count.milestones,
    'Số công bố liên kết': p._count.publications,
  }))

  return XLSX.utils.json_to_sheet(rows)
}

async function buildPublicationsSheet() {
  const pubs = await prisma.nckhPublication.findMany({
    orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
    take: 2000,
    select: {
      title: true,
      pubType: true,
      publishedYear: true,
      journal: true,
      conferenceName: true,
      isISI: true,
      isScopus: true,
      scopusQ: true,
      impactFactor: true,
      citationCount: true,
      doi: true,
      authorsText: true,
      keywords: true,
    },
  })

  const rows = pubs.map((p) => ({
    'Tiêu đề': p.title,
    'Loại công bố': label(PUB_TYPE_LABELS, p.pubType),
    'Năm công bố': p.publishedYear ?? '',
    'Tạp chí / Hội thảo': p.journal ?? p.conferenceName ?? '',
    'ISI': p.isISI ? 'Có' : 'Không',
    'Scopus': p.isScopus ? 'Có' : 'Không',
    'Scopus Q': p.scopusQ ?? '',
    'Impact Factor': p.impactFactor?.toString() ?? '',
    'Số trích dẫn': p.citationCount ?? 0,
    'DOI': p.doi ?? '',
    'Tác giả': p.authorsText ?? '',
    'Từ khóa': (p.keywords ?? []).join(', '),
  }))

  return XLSX.utils.json_to_sheet(rows)
}

async function buildScientistsSheet() {
  const scientists = await prisma.nckhScientistProfile.findMany({
    orderBy: [{ hIndex: 'desc' }, { totalPublications: 'desc' }],
    take: 2000,
    select: {
      academicRank: true,
      degree: true,
      specialization: true,
      researchFields: true,
      hIndex: true,
      i10Index: true,
      totalCitations: true,
      totalPublications: true,
      projectLeadCount: true,
      projectMemberCount: true,
      orcidId: true,
      user: {
        select: {
          name: true,
          rank: true,
          militaryId: true,
          email: true,
          unitRelation: { select: { name: true } },
        },
      },
    },
  })

  const rows = scientists.map((s) => ({
    'Họ và tên': s.user.name,
    'Quân hàm': s.user.rank ?? '',
    'Số hiệu QN': s.user.militaryId ?? '',
    'Đơn vị': s.user.unitRelation?.name ?? '',
    'Email': s.user.email,
    'Học hàm': s.academicRank ?? '',
    'Học vị': s.degree ?? '',
    'Chuyên ngành': s.specialization ?? '',
    'Lĩnh vực NC': (s.researchFields ?? []).map((f) => label(FIELD_LABELS, f)).join(', '),
    'H-Index': s.hIndex ?? 0,
    'i10-Index': s.i10Index ?? 0,
    'Tổng trích dẫn': s.totalCitations ?? 0,
    'Tổng công bố': s.totalPublications ?? 0,
    'Đề tài chủ nhiệm': s.projectLeadCount ?? 0,
    'Đề tài tham gia': s.projectMemberCount ?? 0,
    'ORCID': s.orcidId ?? '',
  }))

  return XLSX.utils.json_to_sheet(rows)
}

// ─── Column width auto-fit ────────────────────────────────────────────────────

function autoFitColumns(ws: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  const colWidths: number[] = []
  for (let C = range.s.c; C <= range.e.c; C++) {
    let max = 10
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
      if (cell?.v) {
        const len = String(cell.v).length
        if (len > max) max = len
      }
    }
    colWidths.push(Math.min(max + 2, 60))
  }
  ws['!cols'] = colWidths.map((w) => ({ wch: w }))
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'projects'  // projects | publications | scientists | all
  const now = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  try {
    const wb = XLSX.utils.book_new()

    if (type === 'projects' || type === 'all') {
      const ws = await buildProjectsSheet()
      autoFitColumns(ws)
      XLSX.utils.book_append_sheet(wb, ws, 'Đề tài NCKH')
    }

    if (type === 'publications' || type === 'all') {
      const ws = await buildPublicationsSheet()
      autoFitColumns(ws)
      XLSX.utils.book_append_sheet(wb, ws, 'Công bố KH')
    }

    if (type === 'scientists' || type === 'all') {
      const ws = await buildScientistsSheet()
      autoFitColumns(ws)
      XLSX.utils.book_append_sheet(wb, ws, 'Nhà khoa học')
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `NCKH_${type}_${now}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[research/export]', err)
    return NextResponse.json({ success: false, error: 'Lỗi xuất dữ liệu' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
