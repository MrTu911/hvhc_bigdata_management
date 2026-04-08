/**
 * GET /api/research/ai/duplicate-check/history
 * UC-49: Return the current user's recent duplicate check audit logs.
 *
 * Query params:
 *   limit  – number of records (default 20, max 100)
 *   cursor – createdAt ISO string for pagination (optional)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit    = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100)
  const cursor   = searchParams.get('cursor') ?? undefined

  try {
    const logs = await db.nckhDuplicateCheckLog.findMany({
      where: {
        userId: auth.user!.id,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id:          true,
        title:       true,
        keywords:    true,
        risk:        true,
        matchCount:  true,
        checkedCount: true,
        createdAt:   true,
        // omit `matches` JSON to keep response light; load on demand if needed
      },
    })

    const hasMore = logs.length > limit
    const items   = hasMore ? logs.slice(0, limit) : logs
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null

    return NextResponse.json({
      success: true,
      data: {
        items,
        hasMore,
        nextCursor,
      },
    })
  } catch (err) {
    console.error('[dup-check/history]', err)
    return NextResponse.json(
      { success: false, error: 'Lỗi tải lịch sử kiểm tra trùng' },
      { status: 500 },
    )
  }
}
