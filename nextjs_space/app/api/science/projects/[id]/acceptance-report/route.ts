import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

const SANG_KIEN_CATEGORIES = ['SANG_KIEN_CO_SO'] as const
const SANG_KIEN_TYPES = ['SANG_KIEN_KINH_NGHIEM'] as const

function isSangKien(category: string, researchType: string) {
  return (
    (SANG_KIEN_CATEGORIES as readonly string[]).includes(category) ||
    (SANG_KIEN_TYPES as readonly string[]).includes(researchType)
  )
}

// GET /api/science/projects/[id]/acceptance-report
// Trả về thông tin sáng kiến + báo cáo chủ nhiệm + hội đồng + kết quả nghiệm thu
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const project = await prisma.nckhProject.findUnique({
    where: { id },
    select: {
      id: true,
      projectCode: true,
      title: true,
      category: true,
      researchType: true,
      field: true,
      status: true,
      phase: true,
      startDate: true,
      endDate: true,
      budgetRequested: true,
      principalInvestigator: {
        select: { id: true, name: true, rank: true, academicTitle: true },
      },
      unit: { select: { id: true, name: true, code: true } },
      members: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true, rank: true } },
        },
        orderBy: { joinDate: 'asc' },
      },
      // Báo cáo do chủ nhiệm nộp (dùng reportType ADHOC + reportPeriod cố định)
      progressReports: {
        where: { reportType: 'ADHOC' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          reportPeriod: true,
          reportType: true,
          content: true,
          status: true,
          completionPercent: true,
          issues: true,
          nextSteps: true,
          attachmentUrl: true,
          submittedAt: true,
          updatedAt: true,
          submittedBy: { select: { id: true, name: true } },
        },
      },
      // Hội đồng nghiệm thu (type ACCEPTANCE)
      councils: {
        where: { type: 'ACCEPTANCE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          type: true,
          meetingDate: true,
          result: true,
          overallScore: true,
          conclusionText: true,
          createdAt: true,
          chairman: { select: { id: true, name: true, rank: true } },
          secretary: { select: { id: true, name: true, rank: true } },
          members: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, name: true, rank: true } },
            },
          },
          reviews: {
            select: {
              id: true,
              criteria: true,
              score: true,
              comment: true,
            },
          },
          meetings: {
            orderBy: { meetingDate: 'desc' },
            take: 1,
            select: {
              id: true,
              meetingDate: true,
              location: true,
              agenda: true,
              minutesContent: true,
            },
          },
        },
      },
      // Kết quả nghiệm thu chính thức
      acceptance: {
        select: {
          id: true,
          acceptanceDate: true,
          acceptanceType: true,
          finalScore: true,
          grade: true,
          result: true,
          conditions: true,
          signedMinutesUrl: true,
          acceptedBy: { select: { id: true, name: true } },
          scores: {
            select: {
              id: true,
              criteria: true,
              score: true,
              comment: true,
            },
          },
        },
      },
    },
  })

  if (!project) {
    return NextResponse.json(
      { success: false, data: null, error: 'Không tìm thấy đề tài' },
      { status: 404 }
    )
  }

  if (!isSangKien(project.category, project.researchType)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Đề tài này không phải sáng kiến' },
      { status: 404 }
    )
  }

  // Tính điểm trung bình theo tiêu chí từ reviews của hội đồng
  const latestCouncil = project.councils[0] ?? null
  const criteriaAverages = latestCouncil
    ? buildCriteriaAverages(latestCouncil.reviews)
    : null

  return NextResponse.json({
    success: true,
    data: {
      project: {
        id: project.id,
        projectCode: project.projectCode,
        title: project.title,
        category: project.category,
        researchType: project.researchType,
        field: project.field,
        status: project.status,
        phase: project.phase,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetRequested: project.budgetRequested,
        principalInvestigator: project.principalInvestigator,
        unit: project.unit,
        members: project.members,
      },
      report: project.progressReports[0] ?? null,
      council: latestCouncil,
      acceptance: project.acceptance ?? null,
      criteriaAverages,
    },
    error: null,
  })
}

// POST /api/science/projects/[id]/acceptance-report
// Chủ nhiệm sáng kiến lưu nháp hoặc nộp nội dung báo cáo
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const project = await prisma.nckhProject.findUnique({
    where: { id },
    select: {
      id: true,
      category: true,
      researchType: true,
      principalInvestigatorId: true,
    },
  })

  if (!project) {
    return NextResponse.json(
      { success: false, data: null, error: 'Không tìm thấy đề tài' },
      { status: 404 }
    )
  }

  if (!isSangKien(project.category, project.researchType)) {
    return NextResponse.json(
      { success: false, data: null, error: 'Đề tài này không phải sáng kiến' },
      { status: 400 }
    )
  }

  // Chỉ chủ nhiệm đề tài hoặc người có quyền duyệt mới được nộp/lưu báo cáo
  const isPI = project.principalInvestigatorId === auth.user!.id
  const isApprover =
    auth.user!.functionCodes?.includes(SCIENCE.PROJECT_APPROVE_DEPT) ||
    auth.user!.functionCodes?.includes(SCIENCE.PROJECT_APPROVE_ACADEMY)

  if (!isPI && !isApprover) {
    return NextResponse.json(
      { success: false, data: null, error: 'Chỉ chủ nhiệm sáng kiến mới được nộp báo cáo' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const {
    reportTitle,
    summary,
    innovation,
    applicability,
    results,
    issues,
    nextSteps,
    attachmentUrl,
    action, // 'save_draft' | 'submit'
  } = body

  if (!summary || !innovation || !applicability || !results) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Các mục tóm tắt, tính mới, khả năng áp dụng và kết quả là bắt buộc',
      },
      { status: 400 }
    )
  }

  const reportStatus = action === 'submit' ? 'SUBMITTED' : 'DRAFT'
  const contentJson = JSON.stringify({ reportTitle, summary, innovation, applicability, results })

  // Tìm báo cáo ADHOC hiện tại để upsert
  const existing = await prisma.nckhProgressReport.findFirst({
    where: { projectId: id, reportType: 'ADHOC', reportPeriod: 'NGHI_THU' },
    select: { id: true, status: true },
  })

  // Không cho phép sửa báo cáo đã SUBMITTED trừ khi có quyền duyệt
  if (existing?.status === 'SUBMITTED' && !isApprover) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Báo cáo đã nộp, không thể chỉnh sửa. Vui lòng liên hệ Phòng NCKH.',
      },
      { status: 409 }
    )
  }

  let report
  if (existing) {
    report = await prisma.nckhProgressReport.update({
      where: { id: existing.id },
      data: {
        content: contentJson,
        issues: issues ?? null,
        nextSteps: nextSteps ?? null,
        attachmentUrl: attachmentUrl ?? null,
        status: reportStatus,
        submittedAt: reportStatus === 'SUBMITTED' ? new Date() : undefined,
        completionPercent: 100,
      },
    })
  } else {
    report = await prisma.nckhProgressReport.create({
      data: {
        projectId: id,
        reportPeriod: 'NGHI_THU',
        reportType: 'ADHOC',
        content: contentJson,
        status: reportStatus,
        completionPercent: 100,
        issues: issues ?? null,
        nextSteps: nextSteps ?? null,
        attachmentUrl: attachmentUrl ?? null,
        submittedById: auth.user!.id,
        submittedAt: reportStatus === 'SUBMITTED' ? new Date() : null,
      },
    })
  }

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: reportStatus === 'SUBMITTED' ? 'SUBMIT' : 'UPDATE',
    resourceType: 'NckhProgressReport',
    resourceId: report.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json(
    { success: true, data: report, error: null },
    { status: existing ? 200 : 201 }
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

type Review = { criteria: string; score: number; comment?: string | null }

function buildCriteriaAverages(reviews: Review[]): Record<string, number> {
  const sums: Record<string, { total: number; count: number }> = {}
  for (const r of reviews) {
    if (!sums[r.criteria]) sums[r.criteria] = { total: 0, count: 0 }
    sums[r.criteria].total += r.score
    sums[r.criteria].count += 1
  }
  const result: Record<string, number> = {}
  for (const [criteria, { total, count }] of Object.entries(sums)) {
    result[criteria] = Math.round((total / count) * 10) / 10
  }
  return result
}
