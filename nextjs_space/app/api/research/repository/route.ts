/**
 * Research Repository / Unified Search – UC Design Section IV
 * GET /api/research/repository?q=...&type=all|project|publication|scientist&year=&field=&page=&limit=
 *
 * Searches across NckhProject, NckhPublication, NckhScientistProfile
 * and returns a unified response with per-type result sets.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI: 'KHXH & NV',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT: 'CNTT',
  Y_DUOC: 'Y dược',
  KHAC: 'Khác',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã phê duyệt', IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành',
  ARCHIVED: 'Lưu trữ', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy',
}

const PUB_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế', BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo', GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến', PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH', LUAN_VAN: 'Luận văn', LUAN_AN: 'Luận án',
}

// ─── Search helpers ────────────────────────────────────────────────────────────

async function searchProjects(q: string, field?: string, year?: number, limit: number = 10) {
  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { title:       { contains: q, mode: 'insensitive' } },
      { titleEn:     { contains: q, mode: 'insensitive' } },
      { abstract:    { contains: q, mode: 'insensitive' } },
      { projectCode: { contains: q, mode: 'insensitive' } },
      { principalInvestigator: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }
  if (field) where.field = field
  if (year)  where.budgetYear = year

  const [total, items] = await Promise.all([
    db.nckhProject.count({ where }),
    db.nckhProject.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, projectCode: true, title: true, category: true,
        field: true, status: true, budgetYear: true,
        principalInvestigator: { select: { name: true, rank: true } },
        unit: { select: { name: true } },
        _count: { select: { members: true, publications: true } },
      },
    }),
  ])

  return {
    total,
    items: items.map((p) => ({
      id: p.id,
      type: 'project' as const,
      code: p.projectCode,
      title: p.title,
      year: p.budgetYear,
      field: FIELD_LABELS[p.field] ?? p.field,
      status: STATUS_LABELS[p.status] ?? p.status,
      meta: `${p.principalInvestigator?.name ?? ''}${p.unit ? ' · ' + p.unit.name : ''}`,
      badges: [`${p._count.members} thành viên`, `${p._count.publications} công bố`],
      href: `/dashboard/research/projects/${p.id}`,
    })),
  }
}

async function searchPublications(q: string, field?: string, year?: number, limit: number = 10) {
  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { title:       { contains: q, mode: 'insensitive' } },
      { titleEn:     { contains: q, mode: 'insensitive' } },
      { authorsText: { contains: q, mode: 'insensitive' } },
      { journal:     { contains: q, mode: 'insensitive' } },
      { doi:         { contains: q, mode: 'insensitive' } },
      { abstract:    { contains: q, mode: 'insensitive' } },
    ]
  }
  if (year) where.publishedYear = year

  const [total, items] = await Promise.all([
    db.nckhPublication.count({ where }),
    db.nckhPublication.findMany({
      where,
      take: limit,
      orderBy: [{ publishedYear: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, title: true, pubType: true, publishedYear: true,
        journal: true, conferenceName: true,
        isISI: true, isScopus: true, scopusQ: true, citationCount: true,
        authorsText: true,
        author: { select: { name: true } },
      },
    }),
  ])

  return {
    total,
    items: items.map((p) => ({
      id: p.id,
      type: 'publication' as const,
      code: p.pubType,
      title: p.title,
      year: p.publishedYear,
      field: PUB_LABELS[p.pubType] ?? p.pubType,
      status: p.isISI ? 'ISI' : p.isScopus ? `Scopus ${p.scopusQ ?? ''}`.trim() : 'Trong nước',
      meta: p.authorsText ?? p.author?.name ?? '',
      badges: [
        ...(p.isISI ? ['ISI'] : []),
        ...(p.isScopus ? [`Scopus${p.scopusQ ? ' ' + p.scopusQ : ''}`] : []),
        ...(p.citationCount ? [`${p.citationCount} trích dẫn`] : []),
        p.journal ?? p.conferenceName ?? '',
      ].filter(Boolean),
      href: `/dashboard/research/publications`,
    })),
  }
}

async function searchScientists(q: string, field?: string, limit: number = 10) {
  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { specialization: { contains: q, mode: 'insensitive' } },
      { bio: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (field) where.researchFields = { has: field }

  const [total, items] = await Promise.all([
    db.nckhScientistProfile.count({ where }),
    db.nckhScientistProfile.findMany({
      where,
      take: limit,
      orderBy: [{ hIndex: 'desc' }, { totalPublications: 'desc' }],
      select: {
        id: true, degree: true, academicRank: true, specialization: true,
        hIndex: true, totalPublications: true, researchFields: true,
        user: {
          select: {
            id: true, name: true, rank: true, militaryId: true,
            unitRelation: { select: { name: true } },
          },
        },
      },
    }),
  ])

  return {
    total,
    items: items.map((s) => ({
      id: s.id,
      type: 'scientist' as const,
      code: s.user.militaryId ?? '',
      title: s.user.name,
      year: null,
      field: (s.researchFields ?? []).map((f) => FIELD_LABELS[f] ?? f).join(', '),
      status: [s.academicRank, s.degree].filter(Boolean).join(' · ') || 'Nhà khoa học',
      meta: s.user.unitRelation?.name ?? '',
      badges: [
        s.specialization ?? '',
        `H-index: ${s.hIndex}`,
        `${s.totalPublications} công bố`,
      ].filter(Boolean),
      href: `/dashboard/research/scientists/${s.id}`,
    })),
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  const { searchParams } = new URL(req.url)
  const q     = (searchParams.get('q') ?? '').trim()
  const type  = searchParams.get('type') ?? 'all'       // all | project | publication | scientist
  const field = searchParams.get('field') ?? undefined
  const year  = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)

  if (!q && !field && !year) {
    return NextResponse.json({
      success: true,
      data: { projects: { total: 0, items: [] }, publications: { total: 0, items: [] }, scientists: { total: 0, items: [] } },
      meta: { query: q, type, total: 0 },
    })
  }

  try {
    const [projects, publications, scientists] = await Promise.all([
      (type === 'all' || type === 'project')     ? searchProjects(q, field, year, limit)     : Promise.resolve({ total: 0, items: [] }),
      (type === 'all' || type === 'publication') ? searchPublications(q, field, year, limit) : Promise.resolve({ total: 0, items: [] }),
      (type === 'all' || type === 'scientist')   ? searchScientists(q, field, limit)         : Promise.resolve({ total: 0, items: [] }),
    ])

    const total = projects.total + publications.total + scientists.total

    return NextResponse.json({
      success: true,
      data: { projects, publications, scientists },
      meta: { query: q, type, field, year, total },
    })
  } catch (err) {
    console.error('[research/repository]', err)
    return NextResponse.json({ success: false, error: 'Lỗi tìm kiếm' }, { status: 500 })
  }
}
