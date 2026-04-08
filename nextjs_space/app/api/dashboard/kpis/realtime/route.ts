import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { DASHBOARD } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, DASHBOARD.VIEW);
    if (!authResult.allowed) {
      return authResult.response!;
    }

    // ── Parallel DB queries for all KPI metrics ─────────────────────────────
    const [
      totalPersonnel,
      activePersonnel,
      avgGpaResult,
      totalResearch,
      totalPublications,
      totalHocVien,
      totalActiveFaculty,
      totalAwards,
      approvedAwards,
      healthyServices,
      totalServices,
      gradeDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.ketQuaHocTap.aggregate({ _avg: { diemTongKet: true } }),
      prisma.scientificResearch.count(),
      prisma.scientificPublication.count(),
      prisma.hocVien.count(),
      prisma.facultyProfile.count({ where: { isActive: true } }),
      prisma.policyRecord.count({ where: { recordType: { in: ['EMULATION', 'REWARD'] } } }),
      prisma.policyRecord.count({ where: { recordType: { in: ['EMULATION', 'REWARD'] }, workflowStatus: 'APPROVED' } }),
      prisma.bigDataService.count({ where: { status: 'HEALTHY', isActive: true } }).catch(() => 0),
      prisma.bigDataService.count({ where: { isActive: true } }).catch(() => 0),
      prisma.ketQuaHocTap.groupBy({
        by: ['ketQua'],
        _count: { id: true },
        where: { ketQua: { not: null } },
      }),
    ]);

    const activeRate = totalPersonnel > 0
      ? parseFloat(((activePersonnel / totalPersonnel) * 100).toFixed(1))
      : 0;

    const avgGpa = avgGpaResult._avg.diemTongKet
      ? parseFloat(avgGpaResult._avg.diemTongKet.toFixed(1))
      : 0;

    const researchTotal = totalResearch + totalPublications;

    const rewardRate = totalAwards > 0
      ? parseFloat(((approvedAwards / totalAwards) * 100).toFixed(1))
      : 0;

    const uptimePct = totalServices > 0
      ? parseFloat(((healthyServices / totalServices) * 100).toFixed(2))
      : 99.9;

    // ── Grade distribution for pie chart ──────────────────────────────────
    const gradeMap: Record<string, number> = {};
    let gradeTotal = 0;
    gradeDistribution.forEach(g => {
      const key = g.ketQua || 'Khác';
      gradeMap[key] = (gradeMap[key] || 0) + g._count.id;
      gradeTotal += g._count.id;
    });

    const pieData = gradeTotal > 0
      ? [
          { name: 'Xuất sắc', value: Math.round(((gradeMap['Xuất sắc'] || 0) / gradeTotal) * 100), color: '#22c55e' },
          { name: 'Giỏi',    value: Math.round(((gradeMap['Giỏi'] || 0) / gradeTotal) * 100),    color: '#3b82f6' },
          { name: 'Khá',     value: Math.round(((gradeMap['Khá'] || 0) / gradeTotal) * 100),     color: '#f59e0b' },
          { name: 'TB',      value: Math.round(((gradeMap['Trung bình'] || 0) / gradeTotal) * 100), color: '#ef4444' },
        ]
      : [
          { name: 'Xuất sắc', value: 0, color: '#22c55e' },
          { name: 'Giỏi',    value: 0, color: '#3b82f6' },
          { name: 'Khá',     value: 0, color: '#f59e0b' },
          { name: 'TB',      value: 0, color: '#ef4444' },
        ];

    return NextResponse.json({
      kpis: {
        totalPersonnel,
        activeRate,
        avgGpa,
        researchTotal,
        rewardRate,
        uptimePct,
        totalHocVien,
        totalActiveFaculty,
      },
      pieData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching real-time KPIs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
