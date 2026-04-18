import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/reports — danh sách báo cáo tiến độ
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const reports = await lifecycleService.listProgressReports(id)
  return NextResponse.json({ success: true, data: reports, error: null })
}

// POST /api/science/projects/[id]/reports — tạo báo cáo tiến độ mới
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { reportPeriod, reportType, content, completionPercent, issues, nextSteps, attachmentUrl } = body

  if (!reportPeriod || !reportType) {
    return NextResponse.json(
      { success: false, data: null, error: 'reportPeriod và reportType là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC'].includes(reportType)) {
    return NextResponse.json(
      { success: false, data: null, error: 'reportType không hợp lệ' },
      { status: 400 }
    )
  }

  const report = await lifecycleService.createProgressReport({
    projectId: id,
    reportPeriod,
    reportType,
    content,
    completionPercent: completionPercent != null ? Number(completionPercent) : undefined,
    issues,
    nextSteps,
    attachmentUrl,
    submittedById: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'CREATE',
    resourceType: 'NckhProgressReport',
    resourceId: report.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: report, error: null }, { status: 201 })
}
