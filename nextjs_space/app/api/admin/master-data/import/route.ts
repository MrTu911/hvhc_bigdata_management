/**
 * I1 – POST /api/admin/master-data/import
 * Bulk import items from JSON payload (upsert semantics).
 * Body: { categoryCode: string, items: ItemInput[], source?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { invalidateCategoryCache } from '@/lib/master-data-cache'

type ItemInput = {
  code: string
  nameVi: string
  nameEn?: string
  shortName?: string
  parentCode?: string
  externalCode?: string
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const body = await req.json()
    const { categoryCode, items, source } = body as {
      categoryCode: string
      items: ItemInput[]
      source?: string
    }

    if (!categoryCode || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu categoryCode hoặc items' }, { status: 400 })
    }

    const cat = await db.masterCategory.findUnique({ where: { code: categoryCode } })
    if (!cat) return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 })

    let addedCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (const item of items) {
      if (!item.code || !item.nameVi) {
        errors.push(`Mục thiếu code/nameVi: ${JSON.stringify(item)}`)
        continue
      }
      try {
        const existing = await db.masterDataItem.findUnique({
          where: { categoryCode_code: { categoryCode, code: item.code } },
        })

        if (existing) {
          await db.masterDataItem.update({
            where: { categoryCode_code: { categoryCode, code: item.code } },
            data: {
              nameVi: item.nameVi,
              nameEn: item.nameEn ?? null,
              shortName: item.shortName ?? null,
              parentCode: item.parentCode ?? null,
              externalCode: item.externalCode ?? null,
              sortOrder: item.sortOrder ?? 0,
              metadata: (item.metadata as any) ?? undefined,
            },
          })
          updatedCount++
        } else {
          await db.masterDataItem.create({
            data: {
              categoryCode,
              code: item.code,
              nameVi: item.nameVi,
              nameEn: item.nameEn ?? null,
              shortName: item.shortName ?? null,
              parentCode: item.parentCode ?? null,
              externalCode: item.externalCode ?? null,
              sortOrder: item.sortOrder ?? 0,
              metadata: (item.metadata as any) ?? undefined,
              createdBy: session.user?.email ?? 'system',
            },
          })
          addedCount++
        }
      } catch (err) {
        errors.push(`Lỗi item '${item.code}': ${(err as Error).message}`)
      }
    }

    // Record sync log
    await db.masterDataSyncLog.create({
      data: {
        categoryCode,
        syncSource: source ?? 'IMPORT_EXCEL',
        addedCount,
        updatedCount,
        errorCount: errors.length,
        logDetail: errors.length > 0 ? ({ errors } as any) : undefined,
        triggeredBy: session.user?.email ?? 'system',
      },
    })

    await invalidateCategoryCache(categoryCode)

    return NextResponse.json({
      success: true,
      addedCount,
      updatedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    })
  } catch (e) {
    console.error('[POST /api/admin/master-data/import]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
