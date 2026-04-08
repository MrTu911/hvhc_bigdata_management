/**
 * API: Party Dashboard Trends (UC-72)
 * Path: /api/party/dashboard/trends
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAnyFunction } from '@/lib/rbac/middleware';
import { PARTY } from '@/lib/rbac/function-codes';

function ym(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyFunction(request, [PARTY.VIEW_DASHBOARD, PARTY.VIEW]);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || `${new Date().getFullYear()}-01-01`;
    const to = searchParams.get('to') || `${new Date().getFullYear()}-12-31`;
    const orgId = searchParams.get('orgId') || '';

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const memberWhere: any = { deletedAt: null, ...(orgId ? { organizationId: orgId } : {}) };
    const meetingWhere: any = { ...(orgId ? { partyOrgId: orgId } : {}) };

    const [joins, attendanceRows, feeRows, reviewRows, disciplineRows, inspectionRows] = await Promise.all([
      prisma.partyMember.findMany({
        where: { ...memberWhere, joinDate: { gte: fromDate, lte: toDate } },
        select: { id: true, joinDate: true },
      }),
      (prisma as any).partyMeetingAttendance.findMany({
        where: {
          meeting: { ...meetingWhere, meetingDate: { gte: fromDate, lte: toDate } },
        },
        select: { attendanceStatus: true, meeting: { select: { meetingDate: true } } },
      }),
      (prisma as any).partyFeePayment.findMany({
        where: {
          partyMember: memberWhere,
          OR: [
            { paymentDate: { gte: fromDate, lte: toDate } },
            { createdAt: { gte: fromDate, lte: toDate } },
          ],
        },
        select: { paymentDate: true, createdAt: true, debtAmount: true, actualAmount: true, expectedAmount: true },
      }),
      (prisma as any).partyAnnualReview.findMany({
        where: {
          partyMember: memberWhere,
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true, grade: true },
      }),
      (prisma as any).partyDiscipline.findMany({
        where: {
          partyMember: memberWhere,
          OR: [
            { decisionDate: { gte: fromDate, lte: toDate } },
            { createdAt: { gte: fromDate, lte: toDate } },
          ],
        },
        select: { decisionDate: true, createdAt: true, severity: true },
      }),
      (prisma as any).partyInspectionTarget.findMany({
        where: {
          openedAt: { gte: fromDate, lte: toDate },
          ...(orgId ? { partyOrgId: orgId } : {}),
        },
        select: { openedAt: true, inspectionType: true },
      }),
    ]);

    const monthly: Record<string, any> = {};
    const ensure = (key: string) => {
      if (!monthly[key]) {
        monthly[key] = {
          month: key,
          newMembers: 0,
          attendancePresent: 0,
          attendanceTotal: 0,
          feeDebt: 0,
          feeActual: 0,
          feeExpected: 0,
          disciplines: 0,
          inspections: 0,
          reviews: 0,
        };
      }
      return monthly[key];
    };

    joins.forEach((x: any) => {
      if (!x.joinDate) return;
      const key = ym(new Date(x.joinDate));
      ensure(key).newMembers += 1;
    });

    attendanceRows.forEach((x: any) => {
      const d = x?.meeting?.meetingDate;
      if (!d) return;
      const key = ym(new Date(d));
      const m = ensure(key);
      m.attendanceTotal += 1;
      if (['PRESENT', 'ON_TIME'].includes(String(x.attendanceStatus || '').toUpperCase())) {
        m.attendancePresent += 1;
      }
    });

    feeRows.forEach((x: any) => {
      const d = x.paymentDate || x.createdAt;
      if (!d) return;
      const key = ym(new Date(d));
      const m = ensure(key);
      m.feeDebt += Number(x.debtAmount || 0);
      m.feeActual += Number(x.actualAmount || 0);
      m.feeExpected += Number(x.expectedAmount || 0);
    });

    reviewRows.forEach((x: any) => {
      const key = ym(new Date(x.createdAt));
      ensure(key).reviews += 1;
    });

    disciplineRows.forEach((x: any) => {
      const d = x.decisionDate || x.createdAt;
      const key = ym(new Date(d));
      ensure(key).disciplines += 1;
    });

    inspectionRows.forEach((x: any) => {
      const key = ym(new Date(x.openedAt));
      ensure(key).inspections += 1;
    });

    const trends = Object.values(monthly)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((x: any) => ({
        ...x,
        attendanceRate: x.attendanceTotal > 0 ? Number(((x.attendancePresent / x.attendanceTotal) * 100).toFixed(2)) : 0,
      }));

    return NextResponse.json({
      from: fromDate,
      to: toDate,
      orgId: orgId || null,
      trends,
    });
  } catch (error) {
    console.error('[Party Dashboard Trends GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
