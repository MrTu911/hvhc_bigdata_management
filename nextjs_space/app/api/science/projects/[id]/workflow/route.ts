/**
 * POST /api/science/projects/:id/workflow
 * Chuyển trạng thái đề tài kèm audit trail.
 *
 * RBAC: PROJECT_APPROVE_DEPT hoặc PROJECT_APPROVE_ACADEMY tùy toStatus.
 * Rule: status transition được guard bởi VALID_STATUS_TRANSITIONS trong service.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { workflowTransitionSchema } from '@/lib/validations/science-project'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Trạng thái yêu cầu quyền phê duyệt cao (academy-level)
const ACADEMY_APPROVE_STATUSES = new Set(['APPROVED', 'COMPLETED'])

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = workflowTransitionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Transition đến APPROVED/COMPLETED yêu cầu academy-level permission
  if (ACADEMY_APPROVE_STATUSES.has(parsed.data.toStatus)) {
    const academyCheck = await authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY)
    if (!academyCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Chuyển sang trạng thái này yêu cầu quyền phê duyệt cấp học viện' },
        { status: 403 }
      )
    }
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.transitionWorkflow(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data })
}
