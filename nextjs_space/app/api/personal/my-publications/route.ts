/**
 * GET  /api/personal/my-publications — Xem danh sách công bố cá nhân (SELF scope)
 * POST /api/personal/my-publications — Tự đăng công bố mới (DRAFT)
 * Yêu cầu: Tầng 1 — Giảng viên/NCV/Cao học
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { authorize } from '@/lib/rbac/authorize';
import { PERSONAL } from '@/lib/rbac/function-codes';
import { prisma } from '@/lib/db';
import { nckhPublicationService } from '@/lib/services/nckh-publication.service';
import { nckhPublicationCreateSchema } from '@/lib/validations/nckh-publication';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.VIEW_PUBLICATIONS, {});
  if (!perm.allowed) {
    return NextResponse.json({ error: perm.deniedReason ?? 'Không có quyền xem công bố khoa học cá nhân' }, { status: 403 });
  }

  try {
    const publications = await prisma.nckhPublication.findMany({
      where: {
        publicationAuthors: { some: { userId: user.id } },
      },
      orderBy: { publishedYear: 'desc' },
      select: {
        id: true,
        title: true,
        pubType: true,
        journal: true,
        publishedYear: true,
        doi: true,
        impactFactor: true,
        status: true,
        reviewNote: true,
        submittedAt: true,
        publicationAuthors: {
          where: { userId: user.id },
          select: { authorOrder: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: publications,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[GET /api/personal/my-publications]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.allowed) return authResult.response!;
  const user = authResult.user!;

  const perm = await authorize(user, PERSONAL.SUBMIT_PUBLICATION, {});
  if (!perm.allowed) {
    return NextResponse.json(
      { error: perm.deniedReason ?? 'Không có quyền đăng công bố' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = nckhPublicationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = {
      ...parsed.data,
      status: 'DRAFT' as const,
      authorId: user.id,
      // Đảm bảo user luôn là tác giả đầu tiên nếu chưa khai báo
      publicationAuthors: parsed.data.publicationAuthors?.length
        ? parsed.data.publicationAuthors
        : [{ authorName: user.name ?? user.username, authorOrder: 1, userId: user.id, isInternal: true }],
    };

    const result = await nckhPublicationService.createPublication(
      { user, scope: 'SELF' },
      input,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[POST /api/personal/my-publications]', error);
    return NextResponse.json({ error: 'Lỗi server: ' + msg }, { status: 500 });
  }
}
