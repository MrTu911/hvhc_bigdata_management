/**
 * GET  /api/science/councils – Danh sách hội đồng KH
 * POST /api/science/councils – Tạo hội đồng KH + chỉ định thành viên
 *
 * RBAC: GET → SCIENTIST_VIEW; POST → COUNCIL_MANAGE
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { councilService } from '@/lib/services/science/council.service'
import { councilCreateSchema } from '@/lib/validations/science-council'

const councilListSchema = z.object({
  type:      z.string().optional(),
  result:    z.string().optional(),
  projectId: z.string().cuid().optional(),
  page:      z.coerce.number().int().min(1).default(1),
  pageSize:  z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = councilListSchema.safeParse({
    type:      searchParams.get('type')      ?? undefined,
    result:    searchParams.get('result')    ?? undefined,
    projectId: searchParams.get('projectId') ?? undefined,
    page:      searchParams.get('page')      ?? undefined,
    pageSize:  searchParams.get('pageSize')  ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await councilService.listCouncils(parsed.data)

  return NextResponse.json({
    success: true,
    data:    result.data.items,
    meta: {
      total:      result.data.total,
      page:       parsed.data.page,
      pageSize:   parsed.data.pageSize,
      totalPages: Math.ceil(result.data.total / parsed.data.pageSize),
    },
    error: null,
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_MANAGE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = councilCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
  const result = await councilService.createCouncil(parsed.data, auth.user!.id, ipAddress)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 })
}
