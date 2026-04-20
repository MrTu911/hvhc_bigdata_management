/**
 * PATCH /api/personal/my-publications/[id] — Sửa công bố (chỉ khi DRAFT hoặc REJECTED)
 * DELETE /api/personal/my-publications/[id] — Xóa công bố (chỉ khi DRAFT)
 * Guard: authorId === user.id
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { nckhPublicationService } from '@/lib/services/nckh-publication.service';
import { nckhPublicationUpdateSchema } from '@/lib/validations/nckh-publication';

export const dynamic = 'force-dynamic';

async function resolvePublication(id: string, userId: string) {
  return prisma.nckhPublication.findFirst({
    where: { id, authorId: userId },
    select: { id: true, status: true, authorId: true },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.SUBMIT_PUBLICATION, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Không có quyền chỉnh sửa công bố' }, { status: 403 });
  }

  const pub = await resolvePublication(params.id, user.id);
  if (!pub) {
    return NextResponse.json({ error: 'Không tìm thấy công bố' }, { status: 404 });
  }
  if (!['DRAFT', 'REJECTED'].includes(pub.status)) {
    return NextResponse.json(
      { error: 'Chỉ được chỉnh sửa công bố ở trạng thái Bản nháp hoặc Bị từ chối' },
      { status: 409 },
    );
  }

  try {
    const body = await request.json();
    const parsed = nckhPublicationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Khi chỉnh sửa lại sau REJECTED, reset về DRAFT
    const updateInput = pub.status === 'REJECTED'
      ? { ...parsed.data, status: 'DRAFT' as const }
      : parsed.data;

    const result = await nckhPublicationService.updatePublication(
      { user, scope: 'SELF' },
      params.id,
      updateInput,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[PATCH /api/personal/my-publications/[id]]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.SUBMIT_PUBLICATION, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Không có quyền xóa công bố' }, { status: 403 });
  }

  const pub = await resolvePublication(params.id, user.id);
  if (!pub) {
    return NextResponse.json({ error: 'Không tìm thấy công bố' }, { status: 404 });
  }
  if (pub.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Chỉ được xóa công bố ở trạng thái Bản nháp' },
      { status: 409 },
    );
  }

  try {
    await prisma.nckhPublication.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[DELETE /api/personal/my-publications/[id]]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
