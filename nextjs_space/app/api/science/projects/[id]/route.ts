/**
 * GET  /api/science/projects/:id  – Chi tiết đề tài
 * PATCH /api/science/projects/:id – Cập nhật đề tài (Sprint 02: ownership guard)
 *
 * Ownership rule (PATCH):
 *   - Principal Investigator của đề tài được chỉnh sửa (khi status = DRAFT hoặc REJECTED).
 *   - Người có PROJECT_APPROVE_DEPT hoặc PROJECT_APPROVE_ACADEMY được chỉnh sửa mọi lúc.
 *   - Tất cả các caller khác nhận 403.
 *
 * RBAC: GET → SCIENTIST_VIEW; PATCH → PROJECT_CREATE + ownership check
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction, requireAnyFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { projectUpdateSchema } from '@/lib/validations/science-project'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── Status values that allow PI self-editing ─────────────────────────────────
const PI_EDITABLE_STATUSES = new Set(['DRAFT', 'REJECTED'])

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  const [confCheck, secretCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE),
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])

  const result = await projectService.getProjectById(
    id,
    confCheck.allowed,
    secretCheck.allowed,
  )

  if (!result.success) {
    return NextResponse.json(
      { success: false, data: null, error: result.error },
      { status: result.error === 'Không tìm thấy đề tài' ? 404 : 403 },
    )
  }

  return NextResponse.json({ success: true, data: result.data, error: null })
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  // Require at minimum PROJECT_CREATE; privileged actors also accepted
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params

  // Fetch project to check ownership and current status
  const [confCheck, secretCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE),
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])

  const existing = await projectService.getProjectById(id, confCheck.allowed, secretCheck.allowed)
  if (!existing.success) {
    return NextResponse.json(
      { success: false, data: null, error: existing.error },
      { status: 404 },
    )
  }

  const project = existing.data

  // ─── Lock check ───────────────────────────────────────────────────────────
  // CANCELLED → locked via status; ARCHIVED → locked via phase (status stays COMPLETED).
  const isLockedStatus = project.status === 'CANCELLED'
  const isArchivedPhase = (project as any).phase === 'ARCHIVED'
  if (isLockedStatus || isArchivedPhase) {
    const reason = isArchivedPhase ? 'đã lưu trữ (ARCHIVED)' : `đã ở trạng thái ${project.status}`
    return NextResponse.json(
      { success: false, data: null, error: `Đề tài ${reason}, không thể chỉnh sửa` },
      { status: 409 }
    )
  }

  // ─── Ownership check ──────────────────────────────────────────────────────
  // Privileged actors (DEPT or ACADEMY approvers) can always edit.
  // PI can only edit when the project is in a PI-editable status.
  const [deptCheck, academyCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_DEPT),
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])

  const isPrivileged = deptCheck.allowed || academyCheck.allowed
  const isPI = project.principalInvestigator.id === auth.user!.id
  const inEditableStatus = PI_EDITABLE_STATUSES.has(project.status as string)

  if (!isPrivileged && !(isPI && inEditableStatus)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: isPI
          ? `Chỉ được chỉnh sửa đề tài ở trạng thái DRAFT hoặc REJECTED. Trạng thái hiện tại: ${project.status}`
          : 'Bạn không phải chủ nhiệm đề tài này',
      },
      { status: 403 },
    )
  }

  // ─── Validate body ────────────────────────────────────────────────────────
  const body = await req.json()
  const parsed = projectUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.updateProject(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, data: null, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data, error: null })
}
