/**
 * M01 – UC-06: Admin Revoke Session
 * POST /api/admin/sessions/[id]/revoke
 *
 * Body: { reason?: 'ADMIN_REVOKE' | 'SUSPICIOUS' }  (default: ADMIN_REVOKE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireFunction } from '@/lib/rbac/middleware';
import { revokeSession } from '@/lib/services/auth/auth-session.service';
import { SECURITY } from '@/lib/rbac/function-codes';
import { logSecurityEvent, getClientIp } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireFunction(request, SECURITY.REVOKE_SESSION);
  if (!auth.allowed) return auth.response!;

  const sessionId = params.id;

  let reason: 'ADMIN_REVOKE' | 'SUSPICIOUS' = 'ADMIN_REVOKE';
  try {
    const body = await request.json().catch(() => ({}));
    if (body.reason === 'SUSPICIOUS') reason = 'SUSPICIOUS';
  } catch {
    // body optional
  }

  const result = await revokeSession(sessionId, reason);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  await logSecurityEvent({
    userId: auth.user!.id,
    eventType: 'PERMISSION_CHANGE',
    severity: reason === 'SUSPICIOUS' ? 'HIGH' : 'MEDIUM',
    ipAddress: getClientIp(request),
    details: { action: 'SESSION_REVOKED', sessionId, reason, revokedBy: auth.user!.id },
  });

  return NextResponse.json({ success: true });
}
