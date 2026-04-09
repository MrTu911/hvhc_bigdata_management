/**
 * GET /api/science/scientists/:id/export
 * Xuất biểu mẫu hồ sơ nhà khoa học chuẩn BQP.
 *
 * Format: ?format=json|csv (default: json)
 * Phase 3 sẽ tích hợp M18 để render docx/pdf theo template BQP thật sự.
 * Hiện tại trả về structured JSON + CSV (đủ để import vào Word/Excel thủ công).
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW (xem) + SCIENCE.REPORT_EXPORT (xuất)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistRepo } from '@/lib/repositories/science/scientist.repo'
import { logAudit } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.REPORT_EXPORT)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const manageCheck = await authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE)
  const canViewConfidential = manageCheck.allowed

  const profile = await scientistRepo.findById(id)
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ nhà khoa học' }, { status: 404 })
  }

  if (profile.sensitivityLevel === 'CONFIDENTIAL' && !canViewConfidential) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền xuất hồ sơ mật' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') ?? 'json'
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  await logAudit({
    userId: auth.user!.id,
    functionCode: 'EXPORT_SCIENCE_REPORT',
    action: 'EXPORT',
    resourceType: 'SCIENTIST_PROFILE',
    resourceId: id,
    result: 'SUCCESS',
    ipAddress,
    metadata: { format },
  })

  if (format === 'csv') {
    const csv = buildCsv(profile)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="scientist-${id}.csv"`,
      },
    })
  }

  // Default: structured JSON
  return NextResponse.json({
    success: true,
    data: buildExportPayload(profile),
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ProfileFull = NonNullable<Awaited<ReturnType<typeof scientistRepo.findById>>>

function buildExportPayload(profile: ProfileFull) {
  return {
    thongTinCoBan: {
      hoTen: profile.user.name,
      quanHam: profile.user.rank,
      soQuan: profile.user.militaryId,
      email: profile.user.email,
      dienThoai: profile.user.phone,
      hocHam: profile.user.academicTitle,
      donVi: profile.user.unitRelation?.name,
      hocVi: profile.degree,
      chuyenNganhChinh: profile.primaryField,
      chuyenNganhPhu: profile.secondaryFields,
      tuKhoa: profile.researchKeywords,
      orcidId: profile.orcidId,
      scopusAuthorId: profile.scopusAuthorId,
    },
    chiSoKhoaHoc: {
      hIndex: profile.hIndex,
      i10Index: profile.i10Index,
      tongTrichDan: profile.totalCitations,
      tongCongTrinhKH: profile.totalPublications,
      soDeAnLamChuNhiem: profile.projectLeadCount,
      soDeAnThamGia: profile.projectMemberCount,
    },
    quatrinh: {
      hocVan: profile.education.map((e) => ({
        hocVi: e.degree,
        chuyenNganh: e.major,
        coSoDaoTao: e.institution,
        quocGia: e.country,
        tuNam: e.yearFrom,
        denNam: e.yearTo,
        luanAn: e.thesisTitle,
      })),
      congTac: profile.career.map((c) => ({
        chucVu: c.position,
        donVi: c.unitName,
        tuNam: c.yearFrom,
        denNam: c.yearTo,
        hienTai: c.isCurrent,
      })),
    },
    khenThuong: profile.scientistAwards.map((a) => ({
      tenGiaiThuong: a.awardName,
      capGiaiThuong: a.level,
      nam: a.year,
      moTa: a.description,
    })),
    tieuSu: profile.bio,
  }
}

function buildCsv(profile: ProfileFull): string {
  const rows: string[][] = [
    ['Trường', 'Giá trị'],
    ['Họ tên', profile.user.name ?? ''],
    ['Quân hàm', profile.user.rank ?? ''],
    ['Số quân', profile.user.militaryId ?? ''],
    ['Email', profile.user.email ?? ''],
    ['Đơn vị', profile.user.unitRelation?.name ?? ''],
    ['Học vị', profile.degree ?? ''],
    ['Chuyên ngành chính', profile.primaryField ?? ''],
    ['ORCID', profile.orcidId ?? ''],
    ['H-Index', String(profile.hIndex)],
    ['i10-Index', String(profile.i10Index)],
    ['Tổng trích dẫn', String(profile.totalCitations)],
    ['Tổng công trình KH', String(profile.totalPublications)],
  ]

  return rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}
