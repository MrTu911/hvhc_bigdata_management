/**
 * POST /api/admin/master-data/cache/flush
 * Flush MDM cache — all or a single category.
 *
 * Body (optional):
 *   { "categoryCode": "RANK" }  → flush only that category
 *   {}                          → flush all MDM cache
 *
 * Requires MANAGE_GOVERNANCE.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import * as cacheService from '@/lib/services/master-data/master-data-cache.service'

export async function POST(req: NextRequest) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  let categoryCode: string | undefined
  try {
    const body = await req.json()
    categoryCode = typeof body?.categoryCode === 'string' ? body.categoryCode.trim() : undefined
  } catch {
    // body is optional; omitted = flush all
  }

  const flushedBy = authResult.user?.email ?? 'system'
  const result = categoryCode
    ? await cacheService.flushCategory(categoryCode, flushedBy)
    : await cacheService.flushAll(flushedBy)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const message =
    result.data.flushed === 'all'
      ? 'Đã xóa toàn bộ cache danh mục'
      : `Đã xóa cache danh mục "${result.data.categoryCode}"`

  return NextResponse.json({ success: true, message, ...result.data })
}
