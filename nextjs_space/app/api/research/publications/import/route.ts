/**
 * POST /api/research/publications/import
 * Import BibTeX text hoặc Excel rows.
 *
 * Body JSON:
 *   { format: 'bibtex', content: string }         ← BibTeX text
 *   { format: 'excel',  rows: Record<string,unknown>[] }  ← Excel rows đã parse phía client
 *
 * Caller parse Excel file → rows trước khi gọi endpoint này.
 * Cách parse file .xlsx tại client: dùng SheetJS (xlsx) với header: 1 option.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { nckhPublicationService } from '@/lib/services/nckh-publication.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.PUB_IMPORT)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { format } = body

  if (!format) {
    return NextResponse.json({ success: false, error: 'Thiếu field format (bibtex | excel)' }, { status: 400 })
  }

  const options = { user: auth.user!, scope: scope(auth) }

  if (format === 'bibtex') {
    const { content } = body
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu field content (BibTeX text)' }, { status: 400 })
    }

    const result = await nckhPublicationService.importFromBibTex(options, content)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: result.data })
  }

  if (format === 'excel') {
    const { rows } = body
    if (!Array.isArray(rows)) {
      return NextResponse.json({ success: false, error: 'Thiếu field rows (array)' }, { status: 400 })
    }

    const result = await nckhPublicationService.importFromExcel(options, rows)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: result.data })
  }

  return NextResponse.json(
    { success: false, error: `Format "${format}" không được hỗ trợ. Dùng: bibtex | excel` },
    { status: 400 }
  )
}
