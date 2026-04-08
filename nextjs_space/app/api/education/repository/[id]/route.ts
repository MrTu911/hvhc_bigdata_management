/**
 * M10 – UC-61: Chi tiết / Xóa một mục kho học vụ
 * GET    /api/education/repository/[id]
 * DELETE /api/education/repository/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_REPOSITORY);
    if (!auth.allowed) return auth.response!;

    const item = await prisma.academicRepositoryItem.findUnique({
      where: { id: params.id },
      include: {
        hocVien: {
          select: { id: true, maHocVien: true, hoTen: true, lop: true },
        },
      },
    });
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireFunction(req, EDUCATION.MANAGE_WARNING); // reuse MANAGE_ guard
    if (!auth.allowed) return auth.response!;

    await prisma.academicRepositoryItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
