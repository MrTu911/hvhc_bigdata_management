/**
 * M10 – UC-52: Cập nhật / publish / archive phiên bản CTĐT
 * GET   /api/education/programs/[id]/versions/[versionId]
 * PATCH /api/education/programs/[id]/versions/[versionId]
 *
 * Chỉ DRAFT mới được sửa nội dung.
 * PUBLISHED không được sửa requiredCoursesJson — phải tạo version mới.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

type Params = { params: { id: string; versionId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const { id: programId, versionId } = params;

    const version = await prisma.programVersion.findFirst({
      where: { id: versionId, programId },
      include: {
        program: { select: { id: true, code: true, name: true } },
        curriculumPlans: {
          select: { id: true, code: true, name: true, cohort: true, status: true },
        },
        _count: { select: { hocViens: true } },
      },
    });

    if (!version) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy phiên bản CTĐT' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: version });
  } catch (error: any) {
    console.error('GET /api/education/programs/[id]/versions/[versionId] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch version' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.UPDATE_PROGRAM);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id: programId, versionId } = params;

    const existing = await prisma.programVersion.findFirst({
      where: { id: versionId, programId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy phiên bản CTĐT' }, { status: 404 });
    }

    const body = await req.json();
    const { action, ...fields } = body;

    // Workflow actions
    if (action === 'publish') {
      if (existing.status !== 'DRAFT') {
        return NextResponse.json(
          { success: false, error: 'Chỉ version ở trạng thái DRAFT mới có thể publish' },
          { status: 400 }
        );
      }
      const version = await prisma.programVersion.update({
        where: { id: versionId },
        data: { status: 'PUBLISHED', approvedBy: user!.id, approvedAt: new Date() },
      });
      await logAudit({
        userId: user!.id, functionCode: EDUCATION.UPDATE_PROGRAM,
        action: 'UPDATE', resourceType: 'PROGRAM_VERSION', resourceId: versionId,
        oldValue: { status: existing.status }, newValue: { status: 'PUBLISHED' },
        result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ success: true, data: version });
    }

    if (action === 'archive') {
      const version = await prisma.programVersion.update({
        where: { id: versionId },
        data: { status: 'ARCHIVED' },
      });
      return NextResponse.json({ success: true, data: version });
    }

    // Content update – chỉ cho phép khi DRAFT
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Không thể sửa nội dung version đã PUBLISHED. Hãy tạo version mới.',
        },
        { status: 400 }
      );
    }

    const data: Record<string, any> = {};
    if (fields.effectiveFromCohort !== undefined) data.effectiveFromCohort = fields.effectiveFromCohort;
    if (fields.totalCredits !== undefined) data.totalCredits = fields.totalCredits;
    if (fields.requiredCoursesJson !== undefined) data.requiredCoursesJson = fields.requiredCoursesJson;
    if (fields.notes !== undefined) data.notes = fields.notes;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Không có field nào được cập nhật' }, { status: 400 });
    }

    const version = await prisma.programVersion.update({ where: { id: versionId }, data });

    await logAudit({
      userId: user!.id, functionCode: EDUCATION.UPDATE_PROGRAM,
      action: 'UPDATE', resourceType: 'PROGRAM_VERSION', resourceId: versionId,
      oldValue: existing, newValue: version,
      result: 'SUCCESS', ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: version });
  } catch (error: any) {
    console.error('PATCH /api/education/programs/[id]/versions/[versionId] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update version' }, { status: 500 });
  }
}
