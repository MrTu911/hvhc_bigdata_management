import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import { scientistProfileService } from '@/lib/services/scientist-profile.service'
import type { FunctionScope } from '@prisma/client'

function scope(auth: Awaited<ReturnType<typeof requireFunction>>): FunctionScope {
  return (auth.authResult?.scope ?? 'SELF') as FunctionScope
}

// POST /api/research/scientists/export
// Body: { unitId?, researchField?, academicRank? }
// Trả về file CSV danh sách nhà khoa học
export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.SCIENTIST_EXPORT)
  if (!auth.allowed) return auth.response!

  const options = {
    user: auth.user!,
    scope: scope(auth),
  }

  const body = await req.json().catch(() => ({}))
  const { unitId, researchField, academicRank } = body as {
    unitId?: string
    researchField?: string
    academicRank?: string
  }

  // Lấy toàn bộ (không pagination) để export
  const result = await scientistProfileService.listScientists(options, {
    unitId,
    researchField,
    academicRank,
    page: 1,
    limit: 5000,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  const rows = result.data as Array<Record<string, unknown>>

  // Build CSV
  const headers = [
    'Họ tên', 'Quân hàm', 'Mã QS', 'Đơn vị',
    'Học hàm', 'Học vị', 'Chuyên ngành',
    'H-index', 'i10-index', 'Trích dẫn',
    'Công bố', 'Đề tài (chủ nhiệm)', 'Đề tài (thành viên)',
    'ORCID', 'Scopus ID', 'Google Scholar ID',
    'Lĩnh vực NC', 'Từ khóa',
  ]

  function esc(v: unknown): string {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const lines: string[] = [headers.join(',')]
  for (const r of rows) {
    const u = r.user as Record<string, unknown> | null ?? {}
    const unitRel = u.unitRelation as Record<string, unknown> | null ?? {}
    lines.push([
      esc(u.name),
      esc(u.rank),
      esc(u.militaryId),
      esc(unitRel.name),
      esc(r.academicRank),
      esc(r.degree),
      esc(r.specialization),
      esc(r.hIndex),
      esc(r.i10Index),
      esc(r.totalCitations),
      esc(r.totalPublications),
      esc(r.projectLeadCount),
      esc(r.projectMemberCount),
      esc(r.orcidId),
      esc(r.scopusAuthorId),
      esc(r.googleScholarId),
      esc(Array.isArray(r.researchFields) ? (r.researchFields as string[]).join('; ') : ''),
      esc(Array.isArray(r.researchKeywords) ? (r.researchKeywords as string[]).join('; ') : ''),
    ].join(','))
  }

  const csv = '\uFEFF' + lines.join('\r\n')   // BOM for Excel UTF-8

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="scientists_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
