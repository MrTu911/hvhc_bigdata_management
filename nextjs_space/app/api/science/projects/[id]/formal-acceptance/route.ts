import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/formal-acceptance — lấy nghiệm thu chính thức
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const record = await lifecycleService.getFormalAcceptance(id)
  return NextResponse.json({ success: true, data: record, error: null })
}

// POST /api/science/projects/[id]/formal-acceptance — ghi nhận nghiệm thu chính thức
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { acceptanceDate, acceptanceType, result, finalScore, grade, conditions, signedMinutesUrl, councilId } = body

  if (!acceptanceDate || !acceptanceType || !result) {
    return NextResponse.json(
      { success: false, data: null, error: 'acceptanceDate, acceptanceType và result là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['PRELIMINARY', 'FINAL'].includes(acceptanceType)) {
    return NextResponse.json(
      { success: false, data: null, error: 'acceptanceType phải là PRELIMINARY | FINAL' },
      { status: 400 }
    )
  }
  if (!['PASS', 'FAIL', 'CONDITIONAL'].includes(result)) {
    return NextResponse.json(
      { success: false, data: null, error: 'result phải là PASS | FAIL | CONDITIONAL' },
      { status: 400 }
    )
  }

  const record = await lifecycleService.createFormalAcceptance({
    projectId:       id,
    acceptanceDate:  new Date(acceptanceDate),
    acceptanceType,
    result,
    finalScore:      finalScore != null ? Number(finalScore) : undefined,
    grade,
    conditions,
    signedMinutesUrl,
    councilId,
    acceptedById:    auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_APPROVE_DEPT,
    action: 'CREATE',
    resourceType: 'NckhAcceptance',
    resourceId: record.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: record, error: null }, { status: 201 })
}
