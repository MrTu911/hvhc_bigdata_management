/**
 * GET /api/science/scientists
 * Danh sách hồ sơ nhà khoa học với education/career/awards.
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW
 * Sensitivity: CONFIDENTIAL profiles chỉ visible khi user cũng có SCIENTIST_MANAGE.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistService } from '@/lib/services/science/scientist.service'
import { scientistListFilterSchema } from '@/lib/validations/science-scientist'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = scientistListFilterSchema.safeParse({
    keyword: searchParams.get('keyword') ?? undefined,
    primaryField: searchParams.get('primaryField') ?? undefined,
    researchAreaId: searchParams.get('researchAreaId') ?? undefined,
    sensitivityLevel: searchParams.get('sensitivityLevel') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // User có SCIENTIST_MANAGE mới xem được hồ sơ mật
  const manageCheck = await authorize(auth.user!, SCIENCE.SCIENTIST_MANAGE)
  const canViewConfidential = manageCheck.allowed

  const result = await scientistService.listScientists(parsed.data, canViewConfidential)

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
