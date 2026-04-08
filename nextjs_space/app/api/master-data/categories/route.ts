/**
 * R1 – GET /api/master-data/categories
 * List all active MasterCategory records.
 * Query: ?groupTag=MILITARY&withCount=true
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAllCategories } from '@/lib/master-data-cache'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const groupTag = searchParams.get('groupTag') ?? undefined
    const withCount = searchParams.get('withCount') === 'true'

    let categories = await getAllCategories()

    if (groupTag) {
      categories = categories.filter(c => c.groupTag === groupTag)
    }

    if (withCount) {
      const counts = await db.masterDataItem.groupBy({
        by: ['categoryCode'],
        where: { isActive: true },
        _count: { id: true },
      })
      const countMap = Object.fromEntries(counts.map(r => [r.categoryCode, r._count.id]))
      return NextResponse.json(categories.map(c => ({ ...c, itemCount: countMap[c.code] ?? 0 })))
    }

    return NextResponse.json(categories)
  } catch (e) {
    console.error('[GET /api/master-data/categories]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
