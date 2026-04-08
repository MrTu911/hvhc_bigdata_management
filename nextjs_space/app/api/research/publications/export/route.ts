/**
 * POST /api/research/publications/export
 * Xuất danh sách công bố theo mẫu.
 *
 * Body JSON:
 *   {
 *     format: 'csv' | 'bqp' | 'hdcgsnn',  // bqp = Biểu 2 BQP, hdcgsnn = mẫu HĐCGSNN
 *     pubType?: string,
 *     year?: number,
 *     unitId?: string,
 *     projectId?: string,
 *   }
 *
 * Response:
 *   - csv       → text/csv
 *   - bqp       → application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *   - hdcgsnn   → application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhPublicationService } from '@/lib/services/nckh-publication.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

const VALID_FORMATS = ['csv', 'bqp', 'hdcgsnn'] as const
type ExportFormat = (typeof VALID_FORMATS)[number]

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.PUB_EXPORT)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { format, pubType, year, unitId, projectId } = body

  if (!VALID_FORMATS.includes(format as ExportFormat)) {
    return NextResponse.json(
      { success: false, error: `Format không hợp lệ. Dùng: ${VALID_FORMATS.join(' | ')}` },
      { status: 400 }
    )
  }

  const result = await nckhPublicationService.exportPublications(
    { user: auth.user!, scope: scope(auth) },
    { format: format as ExportFormat, pubType, year, unitId, projectId }
  )

  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  const now = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cong_bo_${now}.csv"`,
      },
    })
  }

  const templateLabel = format === 'bqp' ? 'bieu2_bqp' : 'hdcgsnn'
  return new NextResponse(result.data, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cong_bo_${templateLabel}_${now}.xlsx"`,
    },
  })
}
