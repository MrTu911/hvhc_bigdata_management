/**
 * R6 – GET /api/master-data/search
 * Cross-category full-text search.
 * Query: ?q=keyword&groupTag=MILITARY&limit=20
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q')?.trim() ?? ''
    const groupTag = searchParams.get('groupTag') ?? undefined
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Từ khóa tối thiểu 2 ký tự' }, { status: 400 })
    }

    const results = await db.masterDataItem.findMany({
      where: {
        isActive: true,
        OR: [
          { nameVi: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { shortName: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { externalCode: { contains: q, mode: 'insensitive' } },
        ],
        ...(groupTag
          ? { category: { groupTag } }
          : {}),
      },
      include: {
        category: { select: { code: true, nameVi: true, groupTag: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
      take: limit,
    })

    return NextResponse.json(results)
  } catch (e) {
    console.error('[GET /api/master-data/search]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
