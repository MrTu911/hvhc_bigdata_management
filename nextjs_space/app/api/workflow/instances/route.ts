/**
 * @deprecated LEGACY WORKFLOW — Chưa migrate sang M13 engine.
 * Route này vẫn được giữ để không phá module cũ.
 * Mục tiêu: migrate sang /api/workflows/* sau khi module nghiệp vụ dùng M13 engine.
 * Xem: docs/design/module-m13-overview.md và migration plan.
 */
/**
 * API: Workflow Instances – Danh sách tất cả workflow instances
 * Path: /api/workflow/instances
 * Unified view across all 4 workflow types with pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireFunction(request, WORKFLOW.VIEW_ALL_INSTANCES);
    if (!authResult.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const workflowType = searchParams.get('type') || ''; // grade | research | policyRequest | award | discipline
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const instances: any[] = [];

    // A3.3 – Policy Requests
    if (!workflowType || workflowType === 'policyRequest') {
      const where: any = { ...(status && { status: status as any }) };
      const requests = await prisma.policyRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, militaryId: true, rank: true } },
          category: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: workflowType ? limit : 10,
        skip: workflowType ? skip : 0,
      }).catch(() => []);

      instances.push(...requests.map(r => ({
        id: r.id,
        type: 'policyRequest',
        typeLabel: 'Hồ sơ chính sách',
        code: 'A3.3',
        title: r.title,
        status: r.status,
        requester: r.requester,
        category: r.category?.name,
        submittedAt: r.submittedAt,
        updatedAt: r.updatedAt,
        url: `/dashboard/policy/requests`,
        color: 'amber',
      })));
    }

    // A3.4 – Awards
    if (!workflowType || workflowType === 'award') {
      const where: any = {
        deletedAt: null,
        recordType: { in: ['REWARD', 'EMULATION'] as any },
        ...(status && { workflowStatus: status as any }),
      };
      const awards = await prisma.policyRecord.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, militaryId: true, rank: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: workflowType ? limit : 10,
        skip: workflowType ? skip : 0,
      }).catch(() => []);

      instances.push(...awards.map(a => ({
        id: a.id,
        type: 'award',
        typeLabel: 'Khen thưởng',
        code: 'A3.4',
        title: a.title,
        status: a.workflowStatus,
        requester: a.user,
        submittedAt: a.proposedAt,
        updatedAt: a.updatedAt,
        url: `/dashboard/emulation/rewards`,
        color: 'yellow',
      })));
    }

    // A3.4 – Disciplines
    if (!workflowType || workflowType === 'discipline') {
      const where: any = {
        deletedAt: null,
        recordType: 'DISCIPLINE' as any,
        ...(status && { workflowStatus: status as any }),
      };
      const disciplines = await prisma.policyRecord.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, militaryId: true, rank: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: workflowType ? limit : 10,
        skip: workflowType ? skip : 0,
      }).catch(() => []);

      instances.push(...disciplines.map(d => ({
        id: d.id,
        type: 'discipline',
        typeLabel: 'Kỷ luật',
        code: 'A3.4',
        title: d.title,
        status: d.workflowStatus,
        requester: d.user,
        submittedAt: d.proposedAt,
        updatedAt: d.updatedAt,
        url: `/dashboard/policy/list`,
        color: 'red',
      })));
    }

    // A3.2 – Research
    if (!workflowType || workflowType === 'research') {
      const research = await prisma.researchProject.findMany({
        where: status ? { workflowStatus: status as any } : { workflowStatus: { not: 'CANCELLED' as any } },
        include: {
          faculty: { select: { id: true, userId: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: workflowType ? limit : 10,
        skip: workflowType ? skip : 0,
      }).catch(() => []);

      instances.push(...research.map(r => ({
        id: r.id,
        type: 'research',
        typeLabel: 'Đề tài NCKH',
        code: 'A3.2',
        title: r.projectName,
        status: r.workflowStatus,
        requester: (r as any).faculty,
        submittedAt: r.createdAt,
        updatedAt: r.updatedAt,
        url: `/dashboard/research/management`,
        color: 'pink',
      })));
    }

    // Sort all by updatedAt desc
    instances.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    const paginated = workflowType ? instances : instances.slice(skip, skip + limit);
    const total = instances.length;

    return NextResponse.json({
      instances: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Workflow Instances GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
