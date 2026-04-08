/**
 * M18 Template API – C3: GET export jobs list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireScopedFunction } from '@/lib/rbac/middleware';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { user, scopedOptions, response } = await requireScopedFunction(request, TEMPLATES.VIEW_JOBS);
    if (!user) return response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const templateId = searchParams.get('templateId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    const scope = scopedOptions?.scope || 'SELF';

    // Scope filtering: SELF sees own jobs; UNIT/ACADEMY sees all
    if (scope === 'SELF') {
      where.requestedBy = user.id;
    }

    if (status) where.status = status;
    if (templateId) where.templateId = templateId;

    const [jobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        select: {
          id: true,
          templateId: true,
          template: { select: { name: true, code: true } },
          entityType: true,
          outputFormat: true,
          status: true,
          progress: true,
          successCount: true,
          failCount: true,
          signedUrl: true,
          urlExpiresAt: true,
          requestedBy: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.exportJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi lấy danh sách export jobs' }, { status: 500 });
  }
}
