/**
 * API: Dashboard Nghiên cứu Khoa học
 * GET /api/dashboard/research
 * v2: Dùng ScientificPublication + ScientificResearch (dữ liệu thực)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { RESEARCH } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

const PUB_TYPE_LABELS: Record<string, string> = {
  GIAO_TRINH:    'Giáo trình',
  TAI_LIEU:      'Tài liệu',
  BAI_TAP:       'Bài tập',
  BAI_BAO:       'Bài báo KH',
  SANG_KIEN:     'Sáng kiến',
  DE_TAI:        'Đề tài NCKH',
  GIAO_TRINH_DT: 'Giáo trình',
};

const PUB_TYPE_COLORS: Record<string, string> = {
  GIAO_TRINH:    '#3b82f6',
  TAI_LIEU:      '#14b8a6',
  BAI_TAP:       '#22c55e',
  BAI_BAO:       '#f43f5e',
  SANG_KIEN:     '#f59e0b',
  DE_TAI:        '#8b5cf6',
  GIAO_TRINH_DT: '#06b6d4',
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, RESEARCH.VIEW);
    if (!authResult.allowed) return authResult.response!;

    // ── 1. Counts ──────────────────────────────────────────────────────────
    const [totalPublications, totalActivities, totalScientists] = await Promise.all([
      prisma.scientificPublication.count(),
      prisma.scientificResearch.count(),
      prisma.facultyProfile.count({ where: { isActive: true } }),
    ]);

    // ── 2. Publications by type ────────────────────────────────────────────
    const pubByTypeRaw = await prisma.scientificPublication.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const pubByType = pubByTypeRaw.map(p => ({
      type: p.type,
      label: PUB_TYPE_LABELS[p.type] || p.type,
      count: p._count.id,
      color: PUB_TYPE_COLORS[p.type] || '#94a3b8',
    }));

    // ── 3. Publications by year (last 6) ───────────────────────────────────
    const pubByYearRaw = await prisma.scientificPublication.groupBy({
      by: ['year'],
      _count: { id: true },
      orderBy: { year: 'desc' },
      take: 6,
    });

    const pubByYear = pubByYearRaw
      .reverse()
      .map(p => ({ year: p.year, count: p._count.id }));

    // ── 4. Research activities by level ────────────────────────────────────
    const actByLevelRaw = await prisma.scientificResearch.groupBy({
      by: ['level'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const actByLevel = actByLevelRaw.map(a => ({
      level: a.level,
      count: a._count.id,
    }));

    // ── 5. Research activities by year ─────────────────────────────────────
    const actByYearRaw = await prisma.scientificResearch.groupBy({
      by: ['year'],
      _count: { id: true },
      orderBy: { year: 'desc' },
      take: 6,
    });

    const actByYear = actByYearRaw
      .reverse()
      .map(a => ({ year: a.year, count: a._count.id }));

    // ── 6. Combined yearly trend ───────────────────────────────────────────
    const yearSet = new Set([...pubByYear.map(y => y.year), ...actByYear.map(y => y.year)]);
    const yearTrend = Array.from(yearSet).sort().map(year => ({
      year,
      publications: pubByYear.find(y => y.year === year)?.count || 0,
      activities:   actByYear.find(y => y.year === year)?.count || 0,
    }));

    // ── 7. Recent publications (10) ────────────────────────────────────────
    const recentPubs = await prisma.scientificPublication.findMany({
      take: 10,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, rank: true } },
      },
    });

    // ── 8. Top scientists by publication count ─────────────────────────────
    const topByPubs = await prisma.scientificPublication.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topUserIds = topByPubs.map(t => t.userId);
    const topUsers = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        name: true,
        rank: true,
        department: true,
        unitId: true,
        unitRelation: { select: { name: true, code: true } },
        facultyProfile: {
          select: { academicDegree: true, academicRank: true, specialization: true }
        },
        _count: { select: { scientificPublications: true, scientificResearch: true } },
      },
    });

    const topScientists = topByPubs.map(t => {
      const u = topUsers.find(u => u.id === t.userId);
      return {
        id: t.userId,
        name: u?.name || 'N/A',
        rank: u?.rank || null,
        unit: (u as any)?.unitRelation?.name || u?.department || 'N/A',
        degree: u?.facultyProfile?.academicDegree || null,
        academicRank: u?.facultyProfile?.academicRank || null,
        pubCount: t._count.id,
        actCount: (u as any)?._count?.scientificResearch || 0,
      };
    });

    // ── 9. Recent research activities (5) ─────────────────────────────────
    const recentActivities = await prisma.scientificResearch.findMany({
      take: 5,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, rank: true } },
      },
    });

    // ── 10. Activity role distribution ─────────────────────────────────────
    const actByRoleRaw = await prisma.scientificResearch.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPublications,
          totalActivities,
          totalScientists,
          // legacy compat (0 since ResearchProject empty)
          totalProjects: 0,
          totalFunding: 0,
        },
        pubByType,
        pubByYear,
        actByLevel,
        actByYear,
        yearTrend,
        topScientists,
        recentPublications: recentPubs.map(p => ({
          id: p.id,
          type: p.type,
          typeLabel: PUB_TYPE_LABELS[p.type] || p.type,
          typeColor: PUB_TYPE_COLORS[p.type] || '#94a3b8',
          title: p.title,
          year: p.year,
          month: p.month,
          role: p.role,
          publisher: p.publisher,
          organization: p.organization,
          coAuthors: p.coAuthors,
          author: p.user?.name || 'N/A',
          authorRank: p.user?.rank || null,
        })),
        recentActivities: recentActivities.map(a => ({
          id: a.id,
          title: a.title,
          year: a.year,
          role: a.role,
          level: a.level,
          type: a.type,
          institution: a.institution,
          result: a.result,
          author: a.user?.name || 'N/A',
          authorRank: a.user?.rank || null,
        })),
        actByRole: actByRoleRaw.map(a => ({ role: a.role, count: a._count.id })),
      },
    });
  } catch (error) {
    console.error('Research dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
