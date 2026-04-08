/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API: Workflow Overview – Tổng quan tất cả quy trình
 * Path: /api/workflow/overview
 * Aggregates pending/active items across all 4 workflow types
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, WORKFLOW.VIEW);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      gradeStats,
      researchStats,
      policyRequestStats,
      awardStats,
      disciplineStats,
    ] = await Promise.all([
      // A3.1 – Điểm học tập
      prisma.ketQuaHocTap.groupBy({
        by: ['workflowStatus'],
        _count: { id: true },
      }).catch(() => []),

      // A3.2 – NCKH
      prisma.researchProject.groupBy({
        by: ['workflowStatus'],
        _count: { id: true },
        where: { workflowStatus: { not: 'CANCELLED' } },
      }).catch(() =>
        prisma.scientificResearch.groupBy({
          by: ['workflowStatus' as any],
          _count: { id: true },
        }).catch(() => [])
      ),

      // A3.3 – Chính sách
      prisma.policyRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }).catch(() => []),

      // A3.4 – Khen thưởng
      prisma.policyRecord.groupBy({
        by: ['workflowStatus'],
        _count: { id: true },
        where: {
          deletedAt: null,
          recordType: { in: ['REWARD', 'EMULATION'] },
        },
      }).catch(() => []),

      // A3.4 – Kỷ luật
      prisma.policyRecord.groupBy({
        by: ['workflowStatus'],
        _count: { id: true },
        where: {
          deletedAt: null,
          recordType: 'DISCIPLINE',
        },
      }).catch(() => []),
    ]);

    const toMap = (arr: { _count: { id: number }; [key: string]: any }[], key: string) =>
      arr.reduce((acc, r) => { acc[r[key]] = r._count.id; return acc; }, {} as Record<string, number>);

    const gradeMap = toMap(gradeStats as any[], 'workflowStatus');
    const researchMap = toMap(researchStats as any[], 'workflowStatus');
    const policyMap = toMap(policyRequestStats as any[], 'status');
    const awardMap = toMap(awardStats as any[], 'workflowStatus');
    const disciplineMap = toMap(disciplineStats as any[], 'workflowStatus');

    // Pending = items needing action
    const pendingGrades = (gradeMap['SUBMITTED'] || 0);
    const pendingResearch = (researchMap['SUBMITTED'] || 0) + (researchMap['UNDER_REVIEW'] || 0) + (researchMap['PENDING_REVIEW'] || 0);
    const pendingPolicy = (policyMap['SUBMITTED'] || 0) + (policyMap['UNDER_REVIEW'] || 0);
    const pendingAwards = (awardMap['PROPOSED'] || 0) + (awardMap['UNDER_REVIEW'] || 0);
    const pendingDisciplines = (disciplineMap['PROPOSED'] || 0) + (disciplineMap['UNDER_REVIEW'] || 0);

    // Recent completed (last 30 days)
    const [recentCompletedAwards, recentCompletedPolicy] = await Promise.all([
      prisma.policyRecord.count({
        where: {
          deletedAt: null,
          workflowStatus: 'APPROVED',
          approvedAt: { gte: last30Days },
        },
      }).catch(() => 0),
      prisma.policyRequest.count({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          approvedAt: { gte: last30Days },
        },
      }).catch(() => 0),
    ]);

    return NextResponse.json({
      summary: {
        totalPending: pendingGrades + pendingResearch + pendingPolicy + pendingAwards + pendingDisciplines,
        recentCompleted: recentCompletedAwards + recentCompletedPolicy,
      },
      byWorkflow: {
        grade: {
          label: 'Quy trình duyệt điểm (A3.1)',
          code: 'A3.1',
          pending: pendingGrades,
          byStatus: gradeMap,
          color: 'blue',
        },
        research: {
          label: 'Quy trình NCKH (A3.2)',
          code: 'A3.2',
          pending: pendingResearch,
          byStatus: researchMap,
          color: 'pink',
        },
        policyRequest: {
          label: 'Quy trình chính sách (A3.3)',
          code: 'A3.3',
          pending: pendingPolicy,
          byStatus: policyMap,
          color: 'amber',
        },
        award: {
          label: 'Quy trình khen thưởng (A3.4)',
          code: 'A3.4',
          pending: pendingAwards,
          byStatus: awardMap,
          color: 'yellow',
        },
        discipline: {
          label: 'Quy trình kỷ luật (A3.4)',
          code: 'A3.4',
          pending: pendingDisciplines,
          byStatus: disciplineMap,
          color: 'red',
        },
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[Workflow Overview GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
