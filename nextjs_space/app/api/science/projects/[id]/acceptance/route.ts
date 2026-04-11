/**
 * GET  /api/science/projects/:id/acceptance  – Lịch sử nghiệm thu
 * POST /api/science/projects/:id/acceptance  – Nộp kết quả nghiệm thu
 *
 * RBAC: GET → SCIENTIST_VIEW; POST → PROJECT_APPROVE_DEPT | PROJECT_APPROVE_ACADEMY
 *
 * Business rule: Chỉ đề tài IN_PROGRESS hoặc PAUSED mới được nộp nghiệm thu.
 * Nếu decision = PASSED → tự động transition sang COMPLETED.
 *
 * Hook điểm cho Sprint-07:
 *   - TODO: Khi PASSED, notify M23 council để kết luận chính thức nếu có
 *   - TODO: Khi PASSED, trigger M24 budget finalization
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction, requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { acceptanceSubmitSchema } from '@/lib/validations/science-project'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const result = await projectService.getAcceptanceRecords(id)

  return NextResponse.json({ success: true, data: result.data, error: null })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = acceptanceSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.submitAcceptance(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
