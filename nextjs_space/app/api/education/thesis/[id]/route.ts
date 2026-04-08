/**
 * M10 – UC-59: Chi tiết & cập nhật khóa luận
 * GET   /api/education/thesis/[id]
 * PATCH /api/education/thesis/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';
import { logAudit } from '@/lib/audit';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_THESIS);
    if (!auth.allowed) return auth.response!;

    const thesis = await prisma.thesisProject.findUnique({
      where: { id: params.id },
      include: {
        hocVien:  { select: { id: true, maHocVien: true, hoTen: true, lop: true, khoaHoc: true } },
        advisor:  { select: { id: true, user: { select: { name: true, email: true } } } },
        reviewer: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    if (!thesis) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khóa luận' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: thesis });
  } catch (error: any) {
    console.error('GET /api/education/thesis/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch thesis' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_THESIS);
    if (!auth.allowed) return auth.response!;
    const { user } = auth;

    const existing = await prisma.thesisProject.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khóa luận' }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = [
      'title', 'titleEn', 'thesisType',
      'advisorId', 'reviewerId',
      'defenseDate', 'defenseScore',
      'status', 'abstractText', 'keywords',
      'notes', 'repositoryFileUrl',
    ] as const;

    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === 'defenseDate') {
          data[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'defenseScore') {
          data[field] = body[field] != null ? parseFloat(body[field]) : null;
        } else {
          data[field] = body[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Không có field nào được cập nhật' }, { status: 400 });
    }

    const updated = await prisma.thesisProject.update({ where: { id: params.id }, data });

    await logAudit({
      userId: user!.id,
      functionCode: EDUCATION.MANAGE_THESIS,
      action: 'UPDATE',
      resourceType: 'THESIS_PROJECT',
      resourceId: params.id,
      oldValue: existing,
      newValue: updated,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PATCH /api/education/thesis/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update thesis' }, { status: 500 });
  }
}
