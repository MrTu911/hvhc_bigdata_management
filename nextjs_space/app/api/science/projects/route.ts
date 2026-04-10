/**
 * GET  /api/science/projects – Danh sách đề tài (với sensitivity filter)
 * POST /api/science/projects – Tạo đề tài mới
 *
 * RBAC: PROJECT_CREATE cho POST, SCIENTIST_VIEW cho GET
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { projectService } from '@/lib/services/science/project.service'
import { projectCreateSchema, projectListFilterSchema } from '@/lib/validations/science-project'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = projectListFilterSchema.safeParse({
    keyword: searchParams.get('keyword') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    phase: searchParams.get('phase') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    sensitivity: searchParams.get('sensitivity') ?? undefined,
    unitId: searchParams.get('unitId') ?? undefined,
    budgetYear: searchParams.get('budgetYear') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const [confCheck, secretCheck] = await Promise.all([
    authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE),
    authorize(auth.user!, SCIENCE.PROJECT_APPROVE_ACADEMY),
  ])

  const result = await projectService.listProjects(
    parsed.data,
    confCheck.allowed,
    secretCheck.allowed
  )

  return NextResponse.json({
    success: true,
    data: result.data.items,
    meta: {
      total: result.data.total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      totalPages: Math.ceil(result.data.total / parsed.data.pageSize),
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.PROJECT_CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = projectCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await projectService.createProject(
    parsed.data,
    auth.user!.id,
    auth.user!.id,
    ipAddress
  )

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
