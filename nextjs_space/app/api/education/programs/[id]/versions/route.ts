/**
 * M10 – UC-52: Phiên bản chương trình đào tạo
 * GET  /api/education/programs/[id]/versions  – danh sách versions của 1 program
 * POST /api/education/programs/[id]/versions  – tạo version mới
 *
 * Rule: không sửa đè version cũ — mỗi thay đổi CTĐT phải tạo version mới.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_PROGRAM);
    if (!auth.allowed) return auth.response!;

    const { id: programId } = params;

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, code: true, name: true },
    });
    if (!program) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chương trình đào tạo' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const versions = await prisma.programVersion.findMany({
      where: {
        programId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        _count: {
          select: {
            hocViens: true,
            curriculumPlans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { program, versions },
    });
  } catch (error: any) {
    console.error('GET /api/education/programs/[id]/versions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch versions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.CREATE_PROGRAM);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const { id: programId } = params;

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chương trình đào tạo' }, { status: 404 });
    }

    const body = await req.json();
    const { versionCode, effectiveFromCohort, totalCredits, requiredCoursesJson, notes } = body;

    if (!versionCode || !effectiveFromCohort) {
      return NextResponse.json(
        { success: false, error: 'versionCode và effectiveFromCohort là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.programVersion.findUnique({
      where: { programId_versionCode: { programId, versionCode } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Version "${versionCode}" đã tồn tại trong chương trình này` },
        { status: 409 }
      );
    }

    const version = await prisma.programVersion.create({
      data: {
        programId,
        versionCode,
        effectiveFromCohort,
        totalCredits: totalCredits ?? null,
        requiredCoursesJson: requiredCoursesJson ?? null,
        notes: notes ?? null,
        status: 'DRAFT',
        createdBy: user!.id,
      },
    });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.CREATE_PROGRAM,
      action: 'CREATE',
      resourceType: 'PROGRAM_VERSION',
      resourceId: version.id,
      newValue: { programId, versionCode, effectiveFromCohort },
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/education/programs/[id]/versions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create version' }, { status: 500 });
  }
}
