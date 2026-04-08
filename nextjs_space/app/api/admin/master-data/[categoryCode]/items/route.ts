/**
 * A5 – GET  /api/admin/master-data/[categoryCode]/items → list (incl. inactive)
 * A6 – POST /api/admin/master-data/[categoryCode]/items → create item
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { masterDataAdminService } from '@/lib/services/master-data/master-data-admin.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const { searchParams } = req.nextUrl
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const parentCode = searchParams.get('parentCode') ?? undefined

    const items = await db.masterDataItem.findMany({
      where: {
        categoryCode: params.categoryCode,
        ...(includeInactive ? {} : { isActive: true }),
        ...(parentCode !== undefined ? { parentCode } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (e) {
    console.error('[GET /api/admin/master-data/[categoryCode]/items]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json()
    const changedBy = session.user?.email ?? 'system'
    const result = await masterDataAdminService.createItem(params.categoryCode, body, changedBy)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/admin/master-data/[categoryCode]/items]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
