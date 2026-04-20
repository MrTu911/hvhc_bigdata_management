/**
 * POST /api/research/publications/[id]/review
 * Phòng khoa học duyệt hoặc từ chối công bố đã nộp.
 * Guard: publication.status === SUBMITTED
 * Quyền: RESEARCH.PUB_REVIEW
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { RESEARCH } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { onPublicationPublished } from '@/lib/services/science/eis-publication-hook.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().min(1, 'Vui lòng nhập lý do').optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, RESEARCH.PUB_REVIEW, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { error: perm.deniedReason ?? 'Không có quyền duyệt công bố' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, reviewNote } = parsed.data;

    if (action === 'REJECT' && !reviewNote) {
      return NextResponse.json(
        { error: 'Vui lòng nhập lý do từ chối' },
        { status: 400 },
      );
    }

    const pub = await prisma.nckhPublication.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, authorId: true },
    });

    if (!pub) {
      return NextResponse.json({ error: 'Không tìm thấy công bố' }, { status: 404 });
    }
    if (pub.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Chỉ được duyệt công bố ở trạng thái Đã nộp' },
        { status: 409 },
      );
    }

    const newStatus = action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED';
    const now = new Date();

    const updated = await prisma.nckhPublication.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        reviewNote: reviewNote ?? null,
        reviewedAt: now,
        reviewedById: user.id,
      },
      select: { id: true, status: true, reviewNote: true, reviewedAt: true, authorId: true },
    });

    // Kích hoạt EIS hook khi duyệt → PUBLISHED
    if (newStatus === 'PUBLISHED') {
      void onPublicationPublished(params.id, updated.authorId).catch((err) =>
        console.error('[review] EIS hook failed:', err),
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/research/publications/[id]/review]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
