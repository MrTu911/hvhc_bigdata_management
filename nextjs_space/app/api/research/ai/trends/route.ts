/**
 * GET /api/research/ai/trends
 * UC-48: AI Trend Analysis — data từ PostgreSQL (không cần AI engine bên ngoài).
 *
 * Trả về:
 * - fieldDistribution: projects + publications theo lĩnh vực (hiện tại)
 * - yearlyTrend: số đề tài + công bố theo năm (5 năm gần nhất)
 * - topResearchers: top 10 nhà khoa học theo số công bố
 * - risingFields: lĩnh vực tăng trưởng so với 2 năm trước
 * - stats: tổng hợp nhanh
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI:   'KHXH & NV',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT:              'CNTT',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i) // last 5 years incl. current

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    // ── 1. Field distribution from projects ────────────────────────────────────
    const projectsByField = await db.nckhProject.groupBy({
      by: ['field'],
      _count: { _all: true },
    })

    const fieldMap: Record<string, { projects: number; publications: number }> = {}
    for (const row of projectsByField) {
      fieldMap[row.field] = { projects: row._count._all, publications: 0 }
    }

    // ── 2. Publications per year ───────────────────────────────────────────────
    const pubsByYear = await db.nckhPublication.groupBy({
      by: ['publishedYear'],
      _count: { _all: true },
      where: { publishedYear: { gte: currentYear - 4 } },
      orderBy: { publishedYear: 'asc' },
    })

    // ── 3. Projects per year ──────────────────────────────────────────────────
    const projectsByYear = await db.nckhProject.groupBy({
      by: ['budgetYear'],
      _count: { _all: true },
      where: { budgetYear: { gte: currentYear - 4, not: null } },
      orderBy: { budgetYear: 'asc' },
    })

    // Merge into yearly trend array
    const pubsByYearMap = new Map(pubsByYear.map((r) => [r.publishedYear, r._count._all]))
    const projsByYearMap = new Map(projectsByYear.map((r) => [r.budgetYear!, r._count._all]))

    const yearlyTrend = YEARS.map((y) => ({
      year: y,
      projects:     projsByYearMap.get(y) ?? 0,
      publications: pubsByYearMap.get(y) ?? 0,
    }))

    // ── 4. Rising fields (compare last 2 years to prior 2 years) ─────────────
    const fieldByYear = await db.nckhProject.groupBy({
      by: ['field', 'budgetYear'],
      _count: { _all: true },
      where: { budgetYear: { gte: currentYear - 3 } },
    })

    const recentMap: Record<string, number> = {}  // currentYear + currentYear-1
    const priorMap:  Record<string, number> = {}  // currentYear-2 + currentYear-3

    for (const row of fieldByYear) {
      const yr = row.budgetYear ?? 0
      if (yr >= currentYear - 1) {
        recentMap[row.field] = (recentMap[row.field] ?? 0) + row._count._all
      } else {
        priorMap[row.field]  = (priorMap[row.field]  ?? 0) + row._count._all
      }
    }

    const risingFields = Object.entries(recentMap)
      .map(([field, recent]) => {
        const prior = priorMap[field] ?? 0
        const growth = prior === 0 ? recent * 100 : Math.round(((recent - prior) / prior) * 100)
        return {
          field,
          label:   FIELD_LABELS[field] ?? field,
          recent,
          prior,
          growth,
          pct:     Math.min(100, Math.max(0, recent * 10)), // visual bar
        }
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5)

    // ── 5. Top researchers ────────────────────────────────────────────────────
    const topScientists = await db.nckhScientistProfile.findMany({
      take: 10,
      orderBy: [{ totalPublications: 'desc' }, { hIndex: 'desc' }],
      select: {
        id: true,
        degree: true,
        academicRank: true,
        specialization: true,
        totalPublications: true,
        hIndex: true,
        researchFields: true,
        user: {
          select: {
            id: true,
            name: true,
            rank: true,
            unitRelation: { select: { name: true } },
          },
        },
      },
    })

    // ── 6. Aggregate stats ────────────────────────────────────────────────────
    const [totalProjects, totalPubs, totalScientists, totalCitations] = await Promise.all([
      db.nckhProject.count(),
      db.nckhPublication.count(),
      db.nckhScientistProfile.count(),
      db.nckhPublication.aggregate({ _sum: { citationCount: true } }),
    ])

    // ── 7. Field distribution with labels ────────────────────────────────────
    const fieldDistribution = Object.entries(fieldMap).map(([field, counts]) => ({
      field,
      label: FIELD_LABELS[field] ?? field,
      projects: counts.projects,
      publications: counts.publications,
      total: counts.projects + counts.publications,
    })).sort((a, b) => b.total - a.total)

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProjects,
          totalPublications: totalPubs,
          totalScientists,
          totalCitations: totalCitations._sum.citationCount ?? 0,
        },
        fieldDistribution,
        yearlyTrend,
        risingFields,
        topResearchers: topScientists.map((s) => ({
          id: s.id,
          name: s.user.name,
          rank: s.user.rank ?? '',
          degree: [s.academicRank, s.degree].filter(Boolean).join(' · ') || '',
          specialization: s.specialization ?? '',
          unit: s.user.unitRelation?.name ?? '',
          publications: s.totalPublications,
          hIndex: s.hIndex,
          fields: (s.researchFields ?? []).map((f) => FIELD_LABELS[f] ?? f),
          href: `/dashboard/research/scientists/${s.id}`,
        })),
      },
    })
  } catch (err) {
    console.error('[research/ai/trends]', err)
    return NextResponse.json({ success: false, error: 'Lỗi tải dữ liệu xu hướng' }, { status: 500 })
  }
}
