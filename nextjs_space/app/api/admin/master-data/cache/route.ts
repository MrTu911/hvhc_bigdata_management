/**
 * GET    /api/admin/master-data/cache          → cache status + DB counts
 * DELETE /api/admin/master-data/cache          → flush all MDM cache
 * DELETE /api/admin/master-data/cache?category=CODE → flush single category
 *
 * Both mutating operations require MANAGE_GOVERNANCE.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { MASTER_DATA } from '@/lib/rbac/function-codes'
import * as cacheService from '@/lib/services/master-data/master-data-cache.service'

export async function GET(req: NextRequest) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  const result = await cacheService.getCacheOverview()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.data)
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireFunction(req, MASTER_DATA.MANAGE)
  if (!authResult.allowed) return authResult.response!

  const categoryCode = req.nextUrl.searchParams.get('category')
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
