/**
 * API: Hạn thăng quân hàm - Promotion Deadline Alerts
 * GET /api/officer-career/promotion-deadlines
 *
 * Returns all officers and soldiers with their promotion eligibility status.
 * Query params:
 *   - type: 'OFFICER' | 'SOLDIER' | 'ALL' (default: ALL)
 *   - status: OVERDUE | CRITICAL | WARNING | UPCOMING | NOT_YET | ALL
 *   - page, limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';
import {
  calcPromotionDeadline,
  OFFICER_RANK_LABELS,
  SOLDIER_RANK_LABELS,
  type DeadlineStatus,
} from '@/lib/promotion/promotionUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, PERSONNEL.VIEW);
    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.authResult?.deniedReason || 'Forbidden' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'ALL';
    const statusFilter = (searchParams.get('status') || 'ALL') as DeadlineStatus | 'ALL';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const results: object[] = [];

    // ── Officers ─────────────────────────────────────────────────────────────
    if (typeFilter === 'ALL' || typeFilter === 'OFFICER') {
      const officers = await prisma.officerCareer.findMany({
        include: {
          personnel: {
            select: {
              id: true,
              fullName: true,
              personnelCode: true,
              dateOfBirth: true,
              unit: { select: { id: true, name: true } },
            },
          },
          promotions: {
            where: { promotionType: 'THANG_CAP' },
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
          specialCases: {
            where: { isActive: true },
            select: { reductionMonths: true },
          },
        },
      });

      for (const o of officers) {
        // Last rank date = most recent THANG_CAP date, fallback to commissionedDate
        const lastRankDate =
          o.promotions[0]?.effectiveDate ?? o.commissionedDate ?? null;

        const totalReduction = o.specialCases.reduce(
          (sum, sc) => sum + sc.reductionMonths,
          0,
        );

        const deadline = calcPromotionDeadline(
          o.currentRank,
          lastRankDate,
          totalReduction,
          o.personnel.dateOfBirth,
          'OFFICER',
        );

        results.push({
          id: o.id,
          personnelId: o.personnel.id,
          personnelCode: o.personnel.personnelCode,
          fullName: o.personnel.fullName,
          unit: o.personnel.unit?.name ?? null,
          rankType: 'OFFICER',
          currentRank: o.currentRank,
          currentRankLabel:
            OFFICER_RANK_LABELS[o.currentRank as keyof typeof OFFICER_RANK_LABELS] ?? o.currentRank,
          ...deadline,
          nextRankLabel: deadline.nextRank
            ? (OFFICER_RANK_LABELS[deadline.nextRank as keyof typeof OFFICER_RANK_LABELS] ?? deadline.nextRank)
            : null,
          specialCaseCount: o.specialCases.length,
        });
      }
    }

    // ── Soldiers ─────────────────────────────────────────────────────────────
    if (typeFilter === 'ALL' || typeFilter === 'SOLDIER') {
      const soldiers = await prisma.soldierProfile.findMany({
        include: {
          personnel: {
            select: {
              id: true,
              fullName: true,
              personnelCode: true,
              dateOfBirth: true,
              unit: { select: { id: true, name: true } },
            },
          },
          specialCases: {
            where: { isActive: true },
            select: { reductionMonths: true },
          },
        },
      });

      for (const s of soldiers) {
        const lastRankDate = s.lastRankDate ?? s.enlistmentDate ?? null;

        const totalReduction = s.specialCases.reduce(
          (sum, sc) => sum + sc.reductionMonths,
          0,
        );

        const deadline = calcPromotionDeadline(
          s.currentRank,
          lastRankDate,
          totalReduction,
          s.personnel.dateOfBirth,
          'SOLDIER',
        );

        results.push({
          id: s.id,
          personnelId: s.personnel.id,
          personnelCode: s.personnel.personnelCode,
          fullName: s.personnel.fullName,
          unit: s.personnel.unit?.name ?? null,
          rankType: 'SOLDIER',
          currentRank: s.currentRank,
          currentRankLabel:
            SOLDIER_RANK_LABELS[s.currentRank as keyof typeof SOLDIER_RANK_LABELS] ?? s.currentRank,
          ...deadline,
          nextRankLabel: deadline.nextRank
            ? (SOLDIER_RANK_LABELS[deadline.nextRank as keyof typeof SOLDIER_RANK_LABELS] ?? deadline.nextRank)
            : null,
          specialCaseCount: s.specialCases.length,
        });
      }
    }

    // ── Filter by status ──────────────────────────────────────────────────────
    const filtered =
      statusFilter === 'ALL'
        ? results
        : results.filter((r: any) => r.status === statusFilter);

    // ── Sort: OVERDUE first, then CRITICAL, WARNING, UPCOMING, NOT_YET ───────
    const ORDER: Record<string, number> = {
      OVERDUE: 0,
      CRITICAL: 1,
      WARNING: 2,
      UPCOMING: 3,
      NOT_YET: 4,
      MAX_RANK: 5,
      NO_DATA: 6,
    };
    filtered.sort(
      (a: any, b: any) =>
        (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) ||
        (a.daysUntilEligible ?? 9999) - (b.daysUntilEligible ?? 9999),
    );

    // ── Summary counters ──────────────────────────────────────────────────────
    const summary = {
      total: filtered.length,
      overdue: filtered.filter((r: any) => r.status === 'OVERDUE').length,
      critical: filtered.filter((r: any) => r.status === 'CRITICAL').length,
      warning: filtered.filter((r: any) => r.status === 'WARNING').length,
      upcoming: filtered.filter((r: any) => r.status === 'UPCOMING').length,
      notYet: filtered.filter((r: any) => r.status === 'NOT_YET').length,
      ageWarnings: filtered.filter((r: any) => r.ageWarning).length,
    };

    // ── Paginate ──────────────────────────────────────────────────────────────
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      summary,
      data: paginated,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (error) {
    console.error('Error fetching promotion deadlines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
