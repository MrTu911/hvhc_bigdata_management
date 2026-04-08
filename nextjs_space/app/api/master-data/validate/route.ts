/**
 * POST /api/master-data/validate
 * Batch-validate item codes before form submit.
 *
 * Body: { items: Array<{ categoryCode: string; code: string }> }
 * Response: { valid: boolean; results: Array<{ categoryCode; code; valid; reason? }> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getItemsByCategory } from '@/lib/master-data-cache'

type ValidateItem = {
  categoryCode: string
  code: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: ValidateItem[] = body?.items ?? []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    if (items.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 items per request' },
        { status: 400 }
      )
    }

    // Group by categoryCode to batch cache reads
    const byCategory = new Map<string, string[]>()
    for (const item of items) {
      if (!item.categoryCode || !item.code) continue
      const arr = byCategory.get(item.categoryCode) ?? []
      arr.push(item.code)
      byCategory.set(item.categoryCode, arr)
    }

    // Build lookup: categoryCode → Set<activeCodes>
    const lookup = new Map<string, Set<string>>()
    await Promise.all(
      Array.from(byCategory.keys()).map(async (cat) => {
        const catItems = await getItemsByCategory(cat, true) // onlyActive=true
        lookup.set(cat, new Set(catItems.map((i) => i.code)))
      })
    )

    const results = items.map((item) => {
      if (!item.categoryCode || !item.code) {
        return {
          categoryCode: item.categoryCode ?? '',
          code: item.code ?? '',
          valid: false,
          reason: 'Missing categoryCode or code',
        }
      }
      const codes = lookup.get(item.categoryCode)
      if (!codes) {
        return {
          categoryCode: item.categoryCode,
          code: item.code,
          valid: false,
          reason: `Category '${item.categoryCode}' not found`,
        }
      }
      const valid = codes.has(item.code)
      return {
        categoryCode: item.categoryCode,
        code: item.code,
        valid,
        ...(!valid && { reason: `Code '${item.code}' not active in '${item.categoryCode}'` }),
      }
    })

    return NextResponse.json({
      valid: results.every((r) => r.valid),
      results,
    })
  } catch (err) {
    console.error('MDM validate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
