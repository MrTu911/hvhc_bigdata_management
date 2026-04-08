/**
 * GET /api/master-data/[categoryCode]
 * Trả về category + danh sách items (active by default).
 * Response: { success, data: { category, items }, error }
 *
 * Query params:
 *   onlyActive=false  – trả cả items inactive (dùng cho admin view)
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataReadService } from '@/lib/services/master-data/master-data-read.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  const { categoryCode } = params
  const onlyActive = req.nextUrl.searchParams.get('onlyActive') !== 'false'

  const result = await masterDataReadService.getCategoryWithItems(categoryCode, onlyActive)

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json(result)
}
