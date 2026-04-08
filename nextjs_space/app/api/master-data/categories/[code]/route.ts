/**
 * R2 – GET /api/master-data/categories/[code]
 * Get one category + its items.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCategoryByCode, getItemsByCategory } from '@/lib/master-data-cache'

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const cat = await getCategoryByCode(params.code)
    if (!cat) return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 })

    const items = await getItemsByCategory(params.code)
    return NextResponse.json({ ...cat, items })
  } catch (e) {
    console.error('[GET /api/master-data/categories/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
