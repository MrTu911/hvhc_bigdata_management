/**
 * API: Tổng hợp dữ liệu nhân sự (Sĩ quan + Quân nhân)
 * GET /api/personnel/aggregate
 *
 * Aggregates data from both officer_careers and soldier_profiles into
 * a unified statistics view for command-level dashboards.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const OFFICER_RANK_LABELS: Record<string, string> = {
  DAI_TUONG: 'Đại tướng', THUONG_TUONG: 'Thượng tướng',
  TRUNG_TUONG: 'Trung tướng', THIEU_TUONG: 'Thiếu tướng',
  DAI_TA: 'Đại tá', THUONG_TA: 'Thượng tá',
  TRUNG_TA: 'Trung tá', THIEU_TA: 'Thiếu tá',
  DAI_UY: 'Đại úy', THUONG_UY: 'Thượng úy',
  TRUNG_UY: 'Trung úy', THIEU_UY: 'Thiếu úy',
};

const SOLDIER_RANK_LABELS: Record<string, string> = {
  THUONG_SI: 'Thượng sĩ', TRUNG_SI: 'Trung sĩ',
  HA_SI: 'Hạ sĩ', BINH_NHAT: 'Binh nhất', BINH_NHI: 'Binh nhì',
};

const SOLDIER_CATEGORY_LABELS: Record<string, string> = {
  QNCN: 'QN chuyên nghiệp', CNVQP: 'CN viên QP',
  HSQ: 'Hạ sĩ quan', CHIEN_SI: 'Chiến sĩ',
};

const HEALTH_CATEGORIES = ['Loại 1', 'Loại 2', 'Loại 3', 'Loại 4', 'Chưa kiểm tra'];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Fetch all data in parallel ────────────────────────────────────────────
    const [officers, soldiers, recentOfficerPromos, recentSoldierRecords] = await Promise.all([
      prisma.officerCareer.findMany({
        select: {
          id: true,
          currentRank: true,
          healthCategory: true,
          lastHealthCheckDate: true,
          personnel: {
            select: {
              fullName: true,
              personnelCode: true,
              dateOfBirth: true,
              unit: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.soldierProfile.findMany({
        select: {
          id: true,
          currentRank: true,
          soldierCategory: true,
          serviceType: true,
          healthCategory: true,
          lastHealthCheckDate: true,
          enlistmentDate: true,
          personnel: {
            select: {
              fullName: true,
              personnelCode: true,
              unit: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.officerPromotion.findMany({
        take: 5,
        orderBy: { effectiveDate: 'desc' },
        include: {
          officerCareer: {
            include: { personnel: { select: { fullName: true } } },
          },
        },
      }),
      prisma.soldierServiceRecord.findMany({
        take: 5,
        where: { eventType: 'THANG_CAP' },
        orderBy: { eventDate: 'desc' },
        include: {
          soldierProfile: {
            include: { personnel: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalOfficers = officers.length;
    const totalSoldiers = soldiers.length;
    const totalPersonnel = totalOfficers + totalSoldiers;

    // ── Rank distribution ─────────────────────────────────────────────────────
    const officerRankCounts: Record<string, number> = {};
    officers.forEach(o => {
      const label = OFFICER_RANK_LABELS[o.currentRank || ''] || 'Chưa xác định';
      officerRankCounts[label] = (officerRankCounts[label] || 0) + 1;
    });

    const soldierRankCounts: Record<string, number> = {};
    soldiers.forEach(s => {
      const label = SOLDIER_RANK_LABELS[s.currentRank || ''] || 'Chưa xác định';
      soldierRankCounts[label] = (soldierRankCounts[label] || 0) + 1;
    });

    // ── Soldier category breakdown ────────────────────────────────────────────
    const soldierCategoryCounts: Record<string, number> = {};
    soldiers.forEach(s => {
      const label = SOLDIER_CATEGORY_LABELS[s.soldierCategory || ''] || 'Chưa xác định';
      soldierCategoryCounts[label] = (soldierCategoryCounts[label] || 0) + 1;
    });

    // ── Unit distribution (combined) ──────────────────────────────────────────
    const unitMap: Record<string, { officers: number; soldiers: number }> = {};
    officers.forEach(o => {
      const unit = o.personnel.unit?.name || 'Không xác định';
      unitMap[unit] = unitMap[unit] || { officers: 0, soldiers: 0 };
      unitMap[unit].officers++;
    });
    soldiers.forEach(s => {
      const unit = s.personnel.unit?.name || 'Không xác định';
      unitMap[unit] = unitMap[unit] || { officers: 0, soldiers: 0 };
      unitMap[unit].soldiers++;
    });

    const byUnit = Object.entries(unitMap)
      .map(([name, counts]) => ({
        name,
        officers: counts.officers,
        soldiers: counts.soldiers,
        total: counts.officers + counts.soldiers,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ── Health aggregation (combined) ─────────────────────────────────────────
    const healthMap = { officer: {} as Record<string, number>, soldier: {} as Record<string, number> };
    let officerCheckedCount = 0;
    let soldierCheckedCount = 0;

    officers.forEach(o => {
      const hc = o.healthCategory || 'Chưa kiểm tra';
      healthMap.officer[hc] = (healthMap.officer[hc] || 0) + 1;
      if (o.lastHealthCheckDate) officerCheckedCount++;
    });

    soldiers.forEach(s => {
      const hc = s.healthCategory || 'Chưa kiểm tra';
      healthMap.soldier[hc] = (healthMap.soldier[hc] || 0) + 1;
      if (s.lastHealthCheckDate) soldierCheckedCount++;
    });

    const healthComparison = HEALTH_CATEGORIES.map(cat => ({
      healthCategory: cat,
      officers: healthMap.officer[cat] || 0,
      soldiers: healthMap.soldier[cat] || 0,
      total: (healthMap.officer[cat] || 0) + (healthMap.soldier[cat] || 0),
    }));

    // ── Recent activity (combined) ────────────────────────────────────────────
    const recentActivity = [
      ...recentOfficerPromos.map(p => ({
        type: 'OFFICER_PROMOTION' as const,
        name: p.officerCareer?.personnel?.fullName || '-',
        event: `Thăng cấp → ${OFFICER_RANK_LABELS[p.newRank || ''] || p.newRank || '-'}`,
        date: p.effectiveDate,
      })),
      ...recentSoldierRecords.map(r => ({
        type: 'SOLDIER_RANK' as const,
        name: r.soldierProfile?.personnel?.fullName || '-',
        event: `Thăng quân hàm → ${SOLDIER_RANK_LABELS[r.newRank || ''] || r.newRank || '-'}`,
        date: r.eventDate,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // ── Age distribution (officers) ───────────────────────────────────────────
    const now = new Date();
    const ageBrackets = [
      { label: '< 30', min: 0,  max: 29 },
      { label: '30–40', min: 30, max: 40 },
      { label: '41–50', min: 41, max: 50 },
      { label: '51–60', min: 51, max: 60 },
      { label: '> 60',  min: 61, max: 999 },
    ];

    const ageDistribution = ageBrackets.map(({ label, min, max }) => ({
      label,
      officers: officers.filter(o => {
        if (!o.personnel.dateOfBirth) return false;
        const age = now.getFullYear() - new Date(o.personnel.dateOfBirth).getFullYear();
        return age >= min && age <= max;
      }).length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPersonnel,
          totalOfficers,
          totalSoldiers,
          officerCheckedCount,
          soldierCheckedCount,
          officerNeedsFollowUp: healthMap.officer['Loại 4'] || 0,
          soldierNeedsFollowUp: healthMap.soldier['Loại 4'] || 0,
        },
        officerRankDistribution: Object.entries(officerRankCounts)
          .map(([rank, count]) => ({ rank, count }))
          .sort((a, b) => b.count - a.count),
        soldierRankDistribution: Object.entries(soldierRankCounts)
          .map(([rank, count]) => ({ rank, count }))
          .sort((a, b) => b.count - a.count),
        soldierCategories: Object.entries(soldierCategoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
        byUnit,
        health: {
          comparison: healthComparison,
          officersByHealth: HEALTH_CATEGORIES.map(cat => ({
            healthCategory: cat,
            count: healthMap.officer[cat] || 0,
          })),
          soldiersByHealth: HEALTH_CATEGORIES.map(cat => ({
            healthCategory: cat,
            count: healthMap.soldier[cat] || 0,
          })),
        },
        recentActivity,
        ageDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching aggregate stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
