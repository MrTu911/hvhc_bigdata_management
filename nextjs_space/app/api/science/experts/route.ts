/**
 * GET /api/science/experts
 * Danh sách chuyên gia khoa học được đề xuất dựa trên lĩnh vực + chỉ số.
 * Wrapper của /api/science/scientists với sort heuristic theo h-index + projectLeadCount.
 * Dùng cho M23 council composition suggestion baseline.
 *
 * Query params:
 *   field?      – lọc theo primaryField (contains, case-insensitive)
 *   keyword?    – tên / mã số
 *   pageSize?   – mặc định 20
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistRepo } from '@/lib/repositories/science/scientist.repo'
import { z } from 'zod'

const expertFilterSchema = z.object({
  field:    z.string().max(200).optional(),
  keyword:  z.string().max(200).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  page:     z.coerce.number().int().min(1).default(1),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = expertFilterSchema.safeParse({
    field:    searchParams.get('field')    ?? undefined,
    keyword:  searchParams.get('keyword')  ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    page:     searchParams.get('page')     ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { field, keyword, page, pageSize } = parsed.data

  const result = await scientistRepo.findMany({
    primaryField: field,
    keyword,
    page,
    pageSize,
    sensitivityLevel: undefined,
    researchAreaId: undefined,
  })

  // Sort by expertise heuristic: h-index * 2 + projectLeadCount + totalPublications/10
  const scored = result.items.map((s) => ({
    ...s,
    _expertScore:
      (s.hIndex ?? 0) * 2 +
      (s.projectLeadCount ?? 0) +
      Math.floor((s.totalPublications ?? 0) / 10),
  }))
  scored.sort((a, b) => b._expertScore - a._expertScore)

  return NextResponse.json({
    success: true,
    data: scored,
    meta: {
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    },
    error: null,
  })
}
