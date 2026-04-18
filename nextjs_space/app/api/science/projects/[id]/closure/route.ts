import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/closure — xem thông tin đóng đề tài
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const closure = await lifecycleService.getClosure(id)
  return NextResponse.json({ success: true, data: closure ?? null, error: null })
}

// POST /api/science/projects/[id]/closure — đóng đề tài chính thức
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_ACADEMY,
    SCIENCE.COUNCIL_FINALIZE,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { closureType, closureDate, finalScore, finalGrade, archiveLocation, notes } = body

  if (!closureType || !closureDate) {
    return NextResponse.json(
      { success: false, data: null, error: 'closureType và closureDate là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['COMPLETED', 'TERMINATED', 'TRANSFERRED'].includes(closureType)) {
    return NextResponse.json(
      { success: false, data: null, error: 'closureType phải là COMPLETED | TERMINATED | TRANSFERRED' },
      { status: 400 }
    )
  }

  try {
    const closure = await lifecycleService.createClosure({
      projectId: id,
      closureType,
      closureDate: new Date(closureDate),
      finalScore: finalScore != null ? Number(finalScore) : undefined,
      finalGrade,
      archiveLocation,
      notes,
      closedById: auth.user!.id,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.PROJECT_APPROVE_ACADEMY,
      action: 'CLOSE',
      resourceType: 'NckhProject',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: closure, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
