/**
 * M01 – UC-07: BQP SSO Callback
 * GET /api/auth/sso/callback?code=...&state=...
 *
 * Nhận authorization code từ BQP IdP, đổi lấy user profile,
 * sau đó tự động tạo/cập nhật user local và đăng nhập.
 *
 * Hiện tại: stub — trả về lỗi NOT_CONFIGURED cho đến khi BQP cung cấp thông tin IdP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSsoAdapter } from '@/lib/integrations/bqp-sso';
import { logSecurityEvent, getClientIp } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const _state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=sso_no_code', request.url));
  }

  const adapter = getSsoAdapter();

  if (!adapter.isConfigured()) {
    await logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      severity: 'LOW',
      ipAddress: getClientIp(request),
      details: { reason: 'BQP SSO not configured', adapter: adapter.name },
    });
    return NextResponse.redirect(new URL('/login?error=sso_not_configured', request.url));
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/sso/callback`;
  const result = await adapter.exchangeCode(code, redirectUri);

  if (!result.success) {
    await logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      severity: 'MEDIUM',
      ipAddress: getClientIp(request),
      details: { reason: result.error, errorCode: result.errorCode },
    });
    return NextResponse.redirect(new URL(`/login?error=sso_${result.errorCode}`, request.url));
  }

  // TODO: upsert user vào DB dựa trên result.user.bqpId / militaryId
  // TODO: tạo NextAuth session cho user đó
  // Placeholder cho đến khi flow đầy đủ được thiết kế với BQP team
  await logSecurityEvent({
    eventType: 'LOGIN_SUCCESS',
    severity: 'LOW',
    ipAddress: getClientIp(request),
    details: { provider: 'BQP_SSO', bqpId: result.user.bqpId, militaryId: result.user.militaryId },
  });

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
