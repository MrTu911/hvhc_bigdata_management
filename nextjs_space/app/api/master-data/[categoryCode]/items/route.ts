/**
 * R3 – GET /api/master-data/[categoryCode]/items
 * List items for a category.
 * Query: ?onlyActive=true|false&parentCode=X&q=search
 */
import { NextRequest, NextResponse } from 'next/server'
import { getItemsByCategory } from '@/lib/master-data-cache'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const { searchParams } = req.nextUrl
    const onlyActive = searchParams.get('onlyActive') !== 'false'
    const parentCode = searchParams.get('parentCode') ?? undefined
    const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

    let items = await getItemsByCategory(params.categoryCode, onlyActive)

    // Enforce validFrom / validTo validity window
    if (onlyActive) {
      const now = new Date()
      items = items.filter(i => {
        if (i.validFrom && new Date(i.validFrom) > now) return false
        if (i.validTo && new Date(i.validTo) < now) return false
        return true
      })
    }

    if (parentCode !== undefined) {
      items = items.filter(i => i.parentCode === parentCode)
    }

    if (q) {
      items = items.filter(
        i =>
          i.nameVi.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          (i.nameEn?.toLowerCase().includes(q) ?? false) ||
          (i.shortName?.toLowerCase().includes(q) ?? false)
      )
    }

    return NextResponse.json({ success: true, data: items })
  } catch (e) {
    console.error('[GET /api/master-data/[categoryCode]/items]', e)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
