/**
 * M01 – UC-06: My Sessions
 * GET /api/auth/sessions/me
 *
 * Trả về danh sách session đang active của user hiện tại.
 * User có thể dùng để xem và tự revoke session trên thiết bị khác.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { getUserActiveSessions, revokeSession } from '@/lib/services/auth/auth-session.service';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  const sessions = await getUserActiveSessions(auth.user!.id);

  return NextResponse.json({ success: true, data: sessions });
}

/**
 * DELETE /api/auth/sessions/me
 * Body: { sessionId: string }
 *
 * User tự revoke session của chính mình (logout thiết bị khác).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu sessionId' },
        { status: 400 }
      );
    }

    // Xác nhận session thuộc về user hiện tại (không cho revoke của người khác)
    const session = await prisma.authSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session không tồn tại' },
        { status: 404 }
      );
    }

    if (session.userId !== auth.user!.id) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền revoke session này' },
        { status: 403 }
      );
    }

    const result = await revokeSession(sessionId, 'LOGOUT');
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Lỗi server' }, { status: 500 });
  }
}
