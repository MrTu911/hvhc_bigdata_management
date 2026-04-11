/**
 * GET /api/science/records – M22 Unified Records Browser
 *
 * Trả về danh sách bản ghi hợp nhất theo type: PROJECT | SCIENTIST | UNIT
 * Dùng cho Data Hub overview và records browser.
 *
 * Query params:
 *   type      – 'PROJECT' | 'SCIENTIST' | 'UNIT' (required)
 *   keyword   – full-text keyword (optional)
 *   page      – default 1
 *   pageSize  – default 20, max 100
 *
 * RBAC: SCIENCE.SCIENTIST_VIEW (VIEW_SCIENTIST_PROFILE)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { unifiedService } from '@/lib/services/science/unified.service'

const querySchema = z.object({
  type:     z.enum(['PROJECT', 'SCIENTIST', 'UNIT']),
  keyword:  z.string().max(300).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    type:     searchParams.get('type') ?? undefined,
    keyword:  searchParams.get('keyword') ?? undefined,
    page:     searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { type, keyword, page, pageSize } = parsed.data

  try {
    const result = await unifiedService.listRecords(type, keyword, page, pageSize)

    return NextResponse.json({
      success: true,
      data: result.items,
      meta: {
        type,
        total:      result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      },
      error: null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/science/records] Error:', err)
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    )
  }
}
