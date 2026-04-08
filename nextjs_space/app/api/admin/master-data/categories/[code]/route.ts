/**
 * A3 – PATCH  /api/admin/master-data/categories/[code] → update category
 * A4 – DELETE /api/admin/master-data/categories/[code] → soft-deactivate
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json()
    const result = await masterDataAdminService.updateCategory(params.code, body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[PATCH /api/admin/master-data/categories/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const changedBy = session.user?.email ?? 'system'
    const result = await masterDataAdminService.deactivateCategory(params.code, changedBy)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/admin/master-data/categories/[code]]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
