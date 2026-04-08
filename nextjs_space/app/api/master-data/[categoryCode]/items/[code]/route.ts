/**
 * R4 – GET /api/master-data/[categoryCode]/items/[code]
 * Get a single item.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getItemByCode } from '@/lib/master-data-cache'

export async function GET(
  _req: NextRequest,
  { params }: { params: { categoryCode: string; code: string } }
) {
  try {
    const item = await getItemByCode(params.categoryCode, params.code)
    if (!item) return NextResponse.json({ error: 'Không tìm thấy mục' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e) {
    console.error('[GET /api/master-data/[categoryCode]/items/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
