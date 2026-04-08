/**
 * A7 – PATCH  /api/admin/master-data/[categoryCode]/items/[code] → update item
 * A8 – DELETE /api/admin/master-data/[categoryCode]/items/[code] → soft-deactivate (via toggle)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

type Ctx = { params: { categoryCode: string; code: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json()
    const changedBy = session.user?.email ?? 'system'
    const result = await masterDataAdminService.updateItem(params.categoryCode, params.code, body, changedBy)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[PATCH /api/admin/master-data/[categoryCode]/items/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    // Deactivate = toggle off (item must currently be active)
    const changedBy = session.user?.email ?? 'system'
    const result = await masterDataAdminService.toggleItemStatus(
      params.categoryCode, params.code, changedBy
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/admin/master-data/[categoryCode]/items/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
