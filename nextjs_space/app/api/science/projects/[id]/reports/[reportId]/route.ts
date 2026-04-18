import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string; reportId: string }>
}

// GET /api/science/projects/[id]/reports/[reportId]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { reportId } = await params
  const report = await lifecycleService.getProgressReport(reportId)
  if (!report) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy báo cáo' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: report, error: null })
}

// PUT /api/science/projects/[id]/reports/[reportId] — cập nhật / review báo cáo
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id, reportId } = await params
  const body = await req.json()
  const { content, completionPercent, issues, nextSteps, attachmentUrl, action, reviewNote } = body

  const updateData: Parameters<typeof lifecycleService.updateProgressReport>[1] = {}

  if (content !== undefined) updateData.content = content
  if (completionPercent != null) updateData.completionPercent = Number(completionPercent)
  if (issues !== undefined) updateData.issues = issues
  if (nextSteps !== undefined) updateData.nextSteps = nextSteps
  if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl

  // action: SUBMIT | APPROVE | REJECT
  if (action === 'SUBMIT') {
    updateData.status = 'SUBMITTED'
    updateData.submittedAt = new Date()
  } else if (action === 'APPROVE') {
    updateData.status = 'APPROVED'
    updateData.reviewedAt = new Date()
    updateData.reviewedById = auth.user!.id
    if (reviewNote) updateData.reviewNote = reviewNote
  } else if (action === 'REJECT') {
    updateData.status = 'REJECTED'
    updateData.reviewedAt = new Date()
    updateData.reviewedById = auth.user!.id
    if (reviewNote) updateData.reviewNote = reviewNote
  }

  const updated = await lifecycleService.updateProgressReport(reportId, updateData)

  if (action) {
    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.PROJECT_APPROVE_DEPT,
      action: action as string,
      resourceType: 'NckhProgressReport',
      resourceId: reportId,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })
  }

  return NextResponse.json({ success: true, data: updated, error: null })
}
