/**
 * PATCH /api/science/projects/:id/milestones/:milestoneId
 * Cập nhật mốc tiến độ (status, completedAt, note).
 *
 * RBAC: PROJECT_CREATE (PI) | PROJECT_APPROVE_DEPT
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { milestoneUpdateSchema } from '@/lib/validations/science-project'

interface RouteParams {
  params: Promise<{ id: string; milestoneId: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id, milestoneId } = await params
  const body = await req.json()

  const parsed = milestoneUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.updateMilestone(
    id,
    milestoneId,
    parsed.data,
    auth.user!.id,
    ipAddress
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data, error: null })
}
