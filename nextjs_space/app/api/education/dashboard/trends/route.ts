/**
 * M10 – UC-62: Dashboard xu hướng cảnh báo / tốt nghiệp theo năm học
 * GET /api/education/dashboard/trends?years=3
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(req.url);
    const yearsBack = Math.min(10, parseInt(searchParams.get('years') || '3'));

    // Last N academic years
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { startYear: 'desc' },
      take: yearsBack,
      select: { id: true, academicYear: true, startYear: true },
    });

    // GraduationAudit approved per academic year (matched by auditDate year range)
    const graduationTrend = await Promise.all(
      academicYears.map(async (ay) => {
        const from = new Date(`${ay.startYear}-01-01`);
        const to   = new Date(`${ay.startYear + 1}-12-31`);
        const [approved, eligible, ineligible] = await Promise.all([
          prisma.graduationAudit.count({ where: { status: 'APPROVED', auditDate: { gte: from, lte: to } } }),
          prisma.graduationAudit.count({ where: { graduationEligible: true,  auditDate: { gte: from, lte: to } } }),
          prisma.graduationAudit.count({ where: { graduationEligible: false, auditDate: { gte: from, lte: to } } }),
        ]);
        return { academicYear: ay.academicYear, approved, eligible, ineligible };
      }),
    );

    // AcademicWarning counts per academic year (active/unresolved at snapshot)
    const warningTrend = await Promise.all(
      academicYears.map(async (ay) => {
        const [critical, high, medium, low] = await Promise.all([
          prisma.academicWarning.count({ where: { academicYear: ay.academicYear, warningLevel: 'CRITICAL' } }),
          prisma.academicWarning.count({ where: { academicYear: ay.academicYear, warningLevel: 'HIGH' } }),
          prisma.academicWarning.count({ where: { academicYear: ay.academicYear, warningLevel: 'MEDIUM' } }),
          prisma.academicWarning.count({ where: { academicYear: ay.academicYear, warningLevel: 'LOW' } }),
        ]);
        return { academicYear: ay.academicYear, critical, high, medium, low, total: critical + high + medium + low };
      }),
    );

    // ThesisProject defense trend per year
    const thesisTrend = await Promise.all(
      academicYears.map(async (ay) => {
        const from = new Date(`${ay.startYear}-01-01`);
        const to   = new Date(`${ay.startYear + 1}-12-31`);
        const [defended, inProgress] = await Promise.all([
          prisma.thesisProject.count({ where: { status: 'DEFENDED', defenseDate: { gte: from, lte: to } } }),
          prisma.thesisProject.count({ where: { status: 'IN_PROGRESS', createdAt: { gte: from, lte: to } } }),
        ]);
        const avgScore = await prisma.thesisProject.aggregate({
          where: { status: 'DEFENDED', defenseDate: { gte: from, lte: to } },
          _avg: { defenseScore: true },
        });
        return {
          academicYear:   ay.academicYear,
          defended,
          inProgress,
          avgDefenseScore: avgScore._avg.defenseScore
            ? Math.round(avgScore._avg.defenseScore * 10) / 10
            : null,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        // reverse to chronological order (oldest first for charts)
        graduation: graduationTrend.reverse(),
        warnings:   warningTrend.reverse(),
        thesis:     thesisTrend.reverse(),
      },
    });
  } catch (error: any) {
    console.error('GET /api/education/dashboard/trends error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
