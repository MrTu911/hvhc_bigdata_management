/**
 * GET /api/master-data/[categoryCode]/tree
 * Trả về category + tree phân cấp (parent-child).
 * Response: { success, data: { category, tree }, error }
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataReadService } from '@/lib/services/master-data/master-data-read.service'

export async function GET(
  _req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  const result = await masterDataReadService.getCategoryTree(params.categoryCode)

  if (!result.success) {
    const status = result.error?.includes('Không tìm thấy') ? 404 : 500
    return NextResponse.json(result, { status })
  }

  return NextResponse.json(result)
}
