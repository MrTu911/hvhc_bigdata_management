/**
 * GET /api/admin/master-data/[categoryCode]/changelog
 * Audit trail for all items in a category.
 */
import { NextRequest, NextResponse } from 'next/server'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const { searchParams } = req.nextUrl
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const changeType = searchParams.get('changeType') ?? undefined
    const itemCode = searchParams.get('itemCode') ?? undefined

    const result = await masterDataAdminService.getChangeLog(
      params.categoryCode,
      page,
      limit,
      { changeType, itemCode }
    )
    return NextResponse.json(result)
  } catch (e) {
    console.error('[GET /api/admin/master-data/[categoryCode]/changelog]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
