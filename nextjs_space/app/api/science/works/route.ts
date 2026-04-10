/**
 * GET  /api/science/works – Danh sách công trình KH
 * POST /api/science/works – Tạo công trình mới (manual)
 *
 * RBAC: WORK_CREATE cho POST, SCIENTIST_VIEW cho GET
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { workService } from '@/lib/services/science/work.service'
import { workCreateSchema, workListFilterSchema } from '@/lib/validations/science-work'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = workListFilterSchema.safeParse({
    keyword: searchParams.get('keyword') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    year: searchParams.get('year') ?? undefined,
    sensitivity: searchParams.get('sensitivity') ?? undefined,
    scientistId: searchParams.get('scientistId') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await workService.listWorks(parsed.data)

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
  const auth = await requireFunction(req, SCIENCE.WORK_CREATE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = workCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await workService.createWork(parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 409 })
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
