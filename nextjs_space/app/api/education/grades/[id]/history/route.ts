/**
 * M10 – UC-56: Lịch sử thay đổi điểm
 * GET /api/education/grades/[id]/history
 *
 * [id] = ClassEnrollment.id
 * Trả về toàn bộ ScoreHistory records theo thời gian.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireFunction } from '@/lib/rbac/middleware';
import { EDUCATION } from '@/lib/rbac/function-codes';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireFunction(req, EDUCATION.VIEW_GRADE);
    if (!auth.allowed) return auth.response!;

    const { id } = await params;

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { id },
      select: { id: true, hocVienId: true, classSectionId: true },
    });
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy enrollment' }, { status: 404 });
    }

    const history = await prisma.scoreHistory.findMany({
      where: { enrollmentId: id },
      orderBy: { changedAt: 'desc' },
      include: {
        enrollment: {
          select: {
            hocVien: { select: { id: true, maHocVien: true, hoTen: true } },
            classSection: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('GET /api/education/grades/[id]/history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch score history' }, { status: 500 });
  }
}
