/**
 * GET /api/science/library – Danh sách tài liệu thư viện số
 *
 * Sensitivity gating: giống search route — downgrade SECRET về CONFIDENTIAL
 * khi request đến từ ngoài IP whitelist.
 *
 * RBAC: SCIENCE.LIBRARY_DOWNLOAD_NORMAL
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { authorize } from '@/lib/rbac/authorize'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { libraryService } from '@/lib/services/science/library.service'
import { libraryListFilterSchema } from '@/lib/validations/science-library'
import { extractClientIp, filterSensitivitiesByIp } from '@/lib/security/ip-guard'

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.LIBRARY_DOWNLOAD_NORMAL)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const parsed = libraryListFilterSchema.safeParse({
    keyword:     searchParams.get('keyword')   ?? undefined,
    sensitivity: searchParams.get('sensitivity') ?? undefined,
    workId:      searchParams.get('workId')    ?? undefined,
    isIndexed:   searchParams.get('isIndexed') ?? undefined,
    page:        searchParams.get('page')      ?? undefined,
    pageSize:    searchParams.get('pageSize')  ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const secretCheck = await authorize(auth.user!, SCIENCE.LIBRARY_DOWNLOAD_SECRET)
  const clientIp    = extractClientIp(req)

  const byClearance = ['NORMAL', 'CONFIDENTIAL']
  if (secretCheck.allowed) byClearance.push('SECRET')
  const allowedSensitivities = filterSensitivitiesByIp(byClearance, clientIp)

  const canViewConfidential = allowedSensitivities.includes('CONFIDENTIAL')
  const canViewSecret       = allowedSensitivities.includes('SECRET')

  const result = await libraryService.listItems(parsed.data, canViewConfidential, canViewSecret)

  // Serialize BigInt fileSize to string for JSON safety
  const items = result.data.items.map((item) => ({
    ...item,
    fileSize: item.fileSize?.toString() ?? '0',
  }))

  return NextResponse.json({
    success: true,
    data:    items,
    meta: {
      total:      result.data.total,
      page:       parsed.data.page,
      pageSize:   parsed.data.pageSize,
      totalPages: Math.ceil(result.data.total / parsed.data.pageSize),
      allowedSensitivities,
    },
    error: null,
  })
}
