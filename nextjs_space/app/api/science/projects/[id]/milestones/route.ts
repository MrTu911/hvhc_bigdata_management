/**
 * GET  /api/science/projects/:id/milestones  – Danh sách mốc tiến độ
 * POST /api/science/projects/:id/milestones  – Thêm mốc tiến độ mới
 *
 * RBAC: GET → SCIENTIST_VIEW; POST → PROJECT_CREATE (PI) | PROJECT_APPROVE_DEPT
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction, requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { milestoneCreateSchema } from '@/lib/validations/science-project'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const result = await projectService.getMilestones(id)

  return NextResponse.json({ success: true, data: result.data, error: null })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()

  const parsed = milestoneCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.addMilestone(id, parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
