/**
 * GET /api/personal/my-research
 * Xem đề tài NCKH mà bản thân là chủ nhiệm hoặc thành viên — SELF scope.
 * Yêu cầu: VIEW_MY_RESEARCH (Tầng 1 — Giảng viên/NCV/Cao học)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PROJECT_SELECT = {
  id: true,
  title: true,
  projectCode: true,
  status: true,
  phase: true,
  category: true,
  field: true,
  researchType: true,
  startDate: true,
  endDate: true,
  actualEndDate: true,
  budgetApproved: true,
  budgetUsed: true,
  completionScore: true,
  completionGrade: true,
  createdAt: true,
  submittedAt: true,
  _count: { select: { members: true, milestones: true, publications: true } },
  milestones: {
    select: { status: true },
  },
} as const;

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_RESEARCH, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { error: perm.deniedReason ?? 'Không có quyền xem đề tài NCKH cá nhân' },
      { status: 403 },
    );
  }

  try {
    const [asPI, asMemberRaw] = await Promise.all([
      prisma.nckhProject.findMany({
        where: { principalInvestigatorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: PROJECT_SELECT,
      }),
      prisma.nckhMember.findMany({
        where: { userId: user.id },
        orderBy: { joinDate: 'desc' },
        select: {
          id: true,
          role: true,
          joinDate: true,
          contribution: true,
          project: { select: PROJECT_SELECT },
        },
      }),
    ]);

    const mapMilestones = (ms: { status: string }[]) => ({
      total: ms.length,
      completed: ms.filter((m) => m.status === 'COMPLETED').length,
      overdue: ms.filter((m) => m.status === 'OVERDUE').length,
      inProgress: ms.filter((m) => m.status === 'IN_PROGRESS').length,
    });

    const enrichedAsPI = asPI.map(({ milestones, ...p }) => ({
      ...p,
      milestoneStats: mapMilestones(milestones),
    }));

    const asMember = asMemberRaw.map(({ project: { milestones, ...proj }, ...m }) => ({
      ...proj,
      milestoneStats: mapMilestones(milestones),
      memberRole: m.role,
      memberId: m.id,
      joinDate: m.joinDate,
      contribution: m.contribution,
    }));

    // Summary stats
    const allProjects = [...enrichedAsPI, ...asMember];
    const summary = {
      totalProjects: allProjects.length,
      totalAsPI: enrichedAsPI.length,
      totalAsMember: asMember.length,
      inProgress: allProjects.filter((p) => p.status === 'IN_PROGRESS').length,
      completed: allProjects.filter((p) => p.status === 'COMPLETED').length,
      totalBudgetApproved: enrichedAsPI.reduce((s, p) => s + (p.budgetApproved ?? 0), 0),
      totalPublications: enrichedAsPI.reduce((s, p) => s + (p._count?.publications ?? 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: { summary, asPI: enrichedAsPI, asMember },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-research]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
