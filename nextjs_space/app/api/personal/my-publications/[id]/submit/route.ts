/**
 * POST /api/personal/my-publications/[id]/submit
 * Chuyển trạng thái DRAFT → SUBMITTED để phòng KH xét duyệt.
 * Guard: authorId === user.id AND status === DRAFT
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.SUBMIT_PUBLICATION, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Không có quyền nộp công bố' }, { status: 403 });
  }

  try {
    const pub = await prisma.nckhPublication.findFirst({
      where: { id: params.id, authorId: user.id },
      select: { id: true, status: true },
    });

    if (!pub) {
      return NextResponse.json({ error: 'Không tìm thấy công bố' }, { status: 404 });
    }
    if (pub.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Chỉ được nộp duyệt công bố ở trạng thái Bản nháp' },
        { status: 409 },
      );
    }

    const updated = await prisma.nckhPublication.update({
      where: { id: params.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        // Xóa ghi chú từ chối cũ nếu có (trường hợp nộp lại sau REJECTED)
        reviewNote: null,
      },
      select: { id: true, status: true, submittedAt: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-publications/[id]/submit]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
