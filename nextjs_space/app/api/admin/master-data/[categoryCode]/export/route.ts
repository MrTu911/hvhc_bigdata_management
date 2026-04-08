/**
 * I2 – GET /api/admin/master-data/[categoryCode]/export
 * Export items as JSON (or CSV via ?format=csv).
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { categoryCode: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const format = searchParams.get('format') ?? 'json'
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const items = await db.masterDataItem.findMany({
      where: {
        categoryCode: params.categoryCode,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { nameVi: 'asc' }],
    })

    if (format === 'csv') {
      const header = 'code,nameVi,nameEn,shortName,parentCode,externalCode,sortOrder,isActive'
      const rows = items.map(i =>
        [
          i.code,
          `"${i.nameVi.replace(/"/g, '""')}"`,
          `"${(i.nameEn ?? '').replace(/"/g, '""')}"`,
          `"${(i.shortName ?? '').replace(/"/g, '""')}"`,
          i.parentCode ?? '',
          i.externalCode ?? '',
          i.sortOrder,
          i.isActive,
        ].join(',')
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${params.categoryCode}.csv"`,
        },
      })
    }

    return NextResponse.json({
      categoryCode: params.categoryCode,
      exportedAt: new Date().toISOString(),
      count: items.length,
      items,
    })
  } catch (e) {
    console.error('[GET /api/admin/master-data/[categoryCode]/export]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
