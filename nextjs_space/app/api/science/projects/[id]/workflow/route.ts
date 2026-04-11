/**
 * POST /api/science/projects/:id/workflow
 * Chuyển trạng thái đề tài kèm audit trail.
 *
 * RBAC theo từng transition:
 *   DRAFT → SUBMITTED:       PI sở hữu đề tài (PROJECT_CREATE)
 *   SUBMITTED → UNDER_REVIEW: PROJECT_APPROVE_DEPT | PROJECT_APPROVE_ACADEMY (intake)
 *   UNDER_REVIEW → APPROVED|REJECTED: PROJECT_APPROVE_DEPT | PROJECT_APPROVE_ACADEMY
 *   APPROVED → IN_PROGRESS:  PI sở hữu (PROJECT_CREATE) hoặc approver
 *   Các transition khác:     PROJECT_APPROVE_DEPT | PROJECT_APPROVE_ACADEMY
 *
 * Rule: transition map được guard bởi VALID_STATUS_TRANSITIONS trong service.
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

// Transition PI được phép tự thực hiện (không cần approver)
const PI_SELF_TRANSITIONS = new Set(['SUBMITTED', 'IN_PROGRESS'])

// Transition yêu cầu quyền academy-level
const ACADEMY_APPROVE_STATUSES = new Set(['APPROVED', 'COMPLETED'])

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Yêu cầu tối thiểu PROJECT_CREATE (PI) hoặc approver role
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
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

  // Kiểm tra quyền theo từng loại transition
  const [deptCheck, academyCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_DEPT),
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])
  const isApprover = deptCheck.allowed || academyCheck.allowed

  if (!isApprover) {
    // Chỉ PI mới được chuyển sang SUBMITTED hoặc IN_PROGRESS (kích hoạt)
    if (!PI_SELF_TRANSITIONS.has(parsed.data.toStatus)) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện thao tác này' },
        { status: 403 }
      )
    }

    // Kiểm tra PI ownership — service sẽ fetch lại project
    const [confCheck, secretCheck] = await Promise.all([
      authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE),
      authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
    ])
    const existing = await projectService.getProjectById(id, confCheck.allowed, secretCheck.allowed)
    if (!existing.success) {
      return NextResponse.json({ success: false, error: existing.error }, { status: 404 })
    }
    if (existing.data.principalInvestigator.id !== auth.user!.id) {
      return NextResponse.json(
        { success: false, error: 'Chỉ chủ nhiệm đề tài mới được thực hiện thao tác này' },
        { status: 403 }
      )
    }
  }

  // Transition APPROVED/COMPLETED yêu cầu academy-level
  if (ACADEMY_APPROVE_STATUSES.has(parsed.data.toStatus) && !academyCheck.allowed) {
    return NextResponse.json(
      { success: false, error: 'Chuyển sang trạng thái này yêu cầu quyền phê duyệt cấp học viện' },
      { status: 403 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  // Pass actual performing function code so audit trail is accurate
  const performingFunctionCode = academyCheck.allowed
    ? SCIENCE.PROJECT_APPROVE_ACADEMY
    : deptCheck.allowed
      ? SCIENCE.PROJECT_APPROVE_DEPT
      : SCIENCE.PROJECT_CREATE

  const result = await projectService.transitionWorkflow(
    id,
    parsed.data,
    auth.user!.id,
    ipAddress,
    performingFunctionCode,
    auth.user!,
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data })
}
