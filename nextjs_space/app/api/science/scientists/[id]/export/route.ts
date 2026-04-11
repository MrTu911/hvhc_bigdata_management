/**
 * GET  /api/science/scientists/:id/export?format=json|csv
 * POST /api/science/scientists/:id/export  body: { templateId, outputFormat }
 *
 * GET  — light export: structured JSON (default) hoặc CSV cho import Word/Excel thủ công.
 * POST — M18 export engine: render DOCX/XLSX/PDF theo template BQP thật sự.
 *
 * RBAC: SCIENCE.REPORT_EXPORT
 * Guard: CONFIDENTIAL profile yêu cầu SCIENTIST_MANAGE thêm.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistRepo } from '@/lib/repositories/science/scientist.repo'
import prisma from '@/lib/db'
import { exportSingle } from '@/lib/services/export-engine-service'
import { logAudit } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

const exportBodySchema = z.object({
  templateId:   z.string().cuid(),
  outputFormat: z.enum(['PDF', 'DOCX', 'XLSX']).default('DOCX'),
})

// ─── Profile fetch (explicit select for type inference) ───────────────────────

async function fetchProfileFull(id: string) {
  return prisma.nckhScientistProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true, rank: true, militaryId: true,
          email: true, phone: true, academicTitle: true,
          unitRelation: { select: { name: true, code: true } },
        },
      },
      education:       { orderBy: { yearFrom: 'desc' } },
      career:          { orderBy: [{ isCurrent: 'desc' }, { yearFrom: 'desc' }] },
      scientistAwards: { orderBy: { year: 'desc' } },
    },
  })
}

type ProfileFull = NonNullable<Awaited<ReturnType<typeof fetchProfileFull>>>

// ─── Sensitivity guard helper ─────────────────────────────────────────────────

async function assertCanExport(
  profile: ProfileFull,
  canViewConfidential: boolean,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  if (profile.sensitivityLevel === 'SECRET') {
    return { allowed: false, error: 'Không thể xuất hồ sơ cấp MẬT qua API này' }
  }
  if (profile.sensitivityLevel === 'CONFIDENTIAL' && !canViewConfidential) {
    return { allowed: false, error: 'Không có quyền xuất hồ sơ MẬT THƯỜNG' }
  }
  return { allowed: true }
}

// ─── GET – light export (JSON / CSV) ─────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.REPORT_EXPORT)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const manageCheck = await authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE)
  const canViewConfidential = manageCheck.allowed
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const profile = await fetchProfileFull(id)
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ nhà khoa học' }, { status: 404 })
  }

  const guard = await assertCanExport(profile, canViewConfidential)
  if (!guard.allowed) {
    return NextResponse.json({ success: false, error: guard.error }, { status: 403 })
  }

  const format = new URL(req.url).searchParams.get('format') ?? 'json'

  await logAudit({
    userId:       auth.user!.id,
    functionCode: 'EXPORT_SCIENCE_REPORT',
    action:       'EXPORT',
    resourceType: 'SCIENTIST_PROFILE',
    resourceId:   id,
    result:       'SUCCESS',
    ipAddress,
    metadata:     { format, mode: 'light' },
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

  return NextResponse.json({ success: true, data: buildExportPayload(profile) })
}

// ─── POST – M18 template export (DOCX / XLSX / PDF) ─────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.REPORT_EXPORT)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const manageCheck = await authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE)
  const canViewConfidential = manageCheck.allowed
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const profile = await fetchProfileFull(id)
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ nhà khoa học' }, { status: 404 })
  }

  const guard = await assertCanExport(profile, canViewConfidential)
  if (!guard.allowed) {
    return NextResponse.json({ success: false, error: guard.error }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = exportBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { templateId, outputFormat } = parsed.data

  try {
    const result = await exportSingle({
      templateId,
      entityId:    id,
      entityType:  'scientist_profile',
      outputFormat,
      requestedBy: auth.user!.id,
      callerType:  'science_scientist',
    })

    await logAudit({
      userId:       auth.user!.id,
      functionCode: 'EXPORT_SCIENCE_REPORT',
      action:       'EXPORT',
      resourceType: 'SCIENTIST_PROFILE',
      resourceId:   id,
      result:       'SUCCESS',
      ipAddress,
      metadata:     { templateId, outputFormat, jobId: result.jobId, mode: 'm18' },
    })

    return NextResponse.json({
      success: true,
      data: {
        jobId:       result.jobId,
        downloadUrl: result.downloadUrl,
        expiresIn:   result.expiresIn,
      },
      error: null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi xuất file'
    await logAudit({
      userId:       auth.user!.id,
      functionCode: 'EXPORT_SCIENCE_REPORT',
      action:       'EXPORT',
      resourceType: 'SCIENTIST_PROFILE',
      resourceId:   id,
      result:       'FAIL',
      ipAddress,
      metadata:     { templateId, outputFormat, error: msg },
    })
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// ─── Light export helpers ─────────────────────────────────────────────────────

function buildExportPayload(profile: ProfileFull) {
  return {
    thongTinCoBan: {
      hoTen:            profile.user.name,
      quanHam:          profile.user.rank,
      soQuan:           profile.user.militaryId,
      email:            profile.user.email,
      dienThoai:        profile.user.phone,
      hocHam:           profile.user.academicTitle,
      donVi:            profile.user.unitRelation?.name,
      hocVi:            profile.degree,
      chuyenNganhChinh: profile.primaryField,
      chuyenNganhPhu:   profile.secondaryFields,
      tuKhoa:           profile.researchKeywords,
      orcidId:          profile.orcidId,
      scopusAuthorId:   profile.scopusAuthorId,
    },
    chiSoKhoaHoc: {
      hIndex:             profile.hIndex,
      i10Index:           profile.i10Index,
      tongTrichDan:       profile.totalCitations,
      tongCongTrinhKH:    profile.totalPublications,
      soDeAnLamChuNhiem:  profile.projectLeadCount,
      soDeAnThamGia:      profile.projectMemberCount,
    },
    quatrinh: {
      hocVan: profile.education.map((e) => ({
        hocVi:       e.degree,
        chuyenNganh: e.major,
        coSoDaoTao:  e.institution,
        quocGia:     e.country,
        tuNam:       e.yearFrom,
        denNam:      e.yearTo,
        luanAn:      e.thesisTitle,
      })),
      congTac: profile.career.map((c) => ({
        chucVu:  c.position,
        donVi:   c.unitName,
        tuNam:   c.yearFrom,
        denNam:  c.yearTo,
        hienTai: c.isCurrent,
      })),
    },
    khenThuong: profile.scientistAwards.map((a) => ({
      tenGiaiThuong: a.awardName,
      capGiaiThuong: a.level,
      nam:           a.year,
      moTa:          a.description,
    })),
    tieuSu: profile.bio,
  }
}

function buildCsv(profile: ProfileFull): string {
  const rows: string[][] = [
    ['Trường', 'Giá trị'],
    ['Họ tên',            profile.user.name ?? ''],
    ['Quân hàm',          profile.user.rank ?? ''],
    ['Số quân',           profile.user.militaryId ?? ''],
    ['Email',             profile.user.email ?? ''],
    ['Đơn vị',            profile.user.unitRelation?.name ?? ''],
    ['Học vị',            profile.degree ?? ''],
    ['Chuyên ngành chính', profile.primaryField ?? ''],
    ['ORCID',             profile.orcidId ?? ''],
    ['H-Index',           String(profile.hIndex)],
    ['i10-Index',         String(profile.i10Index)],
    ['Tổng trích dẫn',    String(profile.totalCitations)],
    ['Tổng công trình KH', String(profile.totalPublications)],
  ]
  return rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}
