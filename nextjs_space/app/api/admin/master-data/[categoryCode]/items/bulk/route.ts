/**
 * A7 – POST /api/admin/master-data/[categoryCode]/items/bulk
 * Bulk upsert items for a single category.
 * Body: { items: BulkItem[], mode?: 'upsert' | 'replace' }
 *   mode='upsert'  (default) – insert new, update existing, leave others unchanged
 *   mode='replace' – upsert all provided + deactivate any item NOT in the list
 */
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { invalidateCategoryCache } from '@/lib/master-data-cache'

type Ctx = { params: { categoryCode: string } }

interface BulkItem {
  code: string
  nameVi: string
  nameEn?: string
  shortName?: string
  parentCode?: string
  externalCode?: string
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Chưa xác thực' }, { status: 401 })

    const { categoryCode } = params

    const category = await db.masterCategory.findUnique({ where: { code: categoryCode } })
    if (!category) return NextResponse.json({ error: 'Danh mục không tồn tại' }, { status: 404 })

    const body = await req.json()
    const items: BulkItem[] = body?.items ?? []
    const mode: 'upsert' | 'replace' = body?.mode === 'replace' ? 'replace' : 'upsert'

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Danh sách items không được trống' }, { status: 400 })
    }

    // Validate codes
    const invalidItems = items.filter((it) => !it.code || !it.nameVi)
    if (invalidItems.length > 0) {
      return NextResponse.json(
        { error: 'Mỗi item phải có code và nameVi', invalidItems },
        { status: 400 },
      )
    }

    const actor = session.user?.email ?? 'system'
    const incomingCodes = new Set(items.map((it) => it.code))

    const results = { inserted: 0, updated: 0, deactivated: 0, errors: [] as string[] }

    // Upsert each item
    for (const it of items) {
      try {
        const existing = await db.masterDataItem.findUnique({
          where: { categoryCode_code: { categoryCode, code: it.code } },
        })

        if (!existing) {
          await db.masterDataItem.create({
            data: {
              categoryCode,
              code: it.code,
              nameVi: it.nameVi,
              nameEn: it.nameEn ?? null,
              shortName: it.shortName ?? null,
              parentCode: it.parentCode ?? null,
              externalCode: it.externalCode ?? null,
              sortOrder: it.sortOrder ?? 0,
              metadata: (it.metadata as any) ?? undefined,
              isActive: true,
            },
          })
          await db.masterDataChangeLog.create({
            data: {
              itemId: (await db.masterDataItem.findUnique({
                where: { categoryCode_code: { categoryCode, code: it.code } },
              }))!.id,
              changeType: 'CREATE',
              newValue: it as any,
              changedBy: actor,
              changeReason: 'Bulk upsert',
            },
          })
          results.inserted++
        } else {
          await db.masterDataItem.update({
            where: { categoryCode_code: { categoryCode, code: it.code } },
            data: {
              nameVi: it.nameVi,
              ...(it.nameEn !== undefined && { nameEn: it.nameEn }),
              ...(it.shortName !== undefined && { shortName: it.shortName }),
              ...(it.parentCode !== undefined && { parentCode: it.parentCode }),
              ...(it.externalCode !== undefined && { externalCode: it.externalCode }),
              ...(it.sortOrder !== undefined && { sortOrder: it.sortOrder }),
              ...(it.metadata !== undefined && { metadata: it.metadata as any }),
              isActive: true,
            },
          })
          results.updated++
        }
      } catch (err) {
        results.errors.push(`${it.code}: ${(err as Error).message}`)
      }
    }

    // Replace mode: deactivate items NOT in incoming list
    if (mode === 'replace') {
      const toDeactivate = await db.masterDataItem.findMany({
        where: { categoryCode, isActive: true, code: { notIn: Array.from(incomingCodes) } },
        select: { id: true, code: true },
      })
      for (const d of toDeactivate) {
        await db.masterDataItem.update({ where: { id: d.id }, data: { isActive: false } })
        await db.masterDataChangeLog.create({
          data: {
            itemId: d.id,
            changeType: 'DEACTIVATE',
            oldValue: { isActive: true } as any,
            newValue: { isActive: false } as any,
            changedBy: actor,
            changeReason: 'Bulk replace — not in new list',
          },
        })
        results.deactivated++
      }
    }

    await invalidateCategoryCache(categoryCode)
    return NextResponse.json({ success: true, categoryCode, mode, ...results })
  } catch (e) {
    console.error('[POST bulk]', e)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
