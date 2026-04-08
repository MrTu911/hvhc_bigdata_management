/**
 * M01 – UC-06: Admin Session Management
 * GET /api/admin/sessions
 *
 * Query params:
 *   - userId: string (optional) — lọc theo user
 *   - isActive: 'true' | 'false' (optional) — lọc theo trạng thái
 *   - page: number (default 1)
 *   - pageSize: number (default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { getAllSessions } from '@/lib/services/auth/auth-session.service';
import { SECURITY } from '@/lib/rbac/function-codes';

export async function GET(request: NextRequest) {
  const auth = await requireFunction(request, SECURITY.VIEW_SESSIONS);
  if (!auth.allowed) return auth.response!;

  const { searchParams } = new URL(request.url);

  const userId = searchParams.get('userId') ?? undefined;
  const isActiveParam = searchParams.get('isActive');
  const isActive =
    isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '20')));

  const result = await getAllSessions({ userId, isActive }, page, pageSize);

  return NextResponse.json({ success: true, data: result });
}
