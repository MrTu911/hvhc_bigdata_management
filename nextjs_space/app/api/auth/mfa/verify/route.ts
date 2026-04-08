/**
 * M01 – UC-01: MFA Verify (bật MFA sau khi setup)
 * POST /api/auth/mfa/verify
 * Body: { token: string }
 *
 * Gọi sau khi user đã quét QR (setup) để xác nhận token đầu tiên.
 * Sau bước này MFA mới thực sự được bật.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { verifyAndEnableMfa } from '@/lib/services/auth/mfa.service';
import { logSecurityEvent, getClientIp } from '@/lib/audit';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  // Rate limit theo IP: 5 lần / 15 phút
  const ip = getClientIp(request) ?? 'unknown';
  const rl = await checkRateLimit(ip, 'otp');
  if (!rl.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${rl.retryAfter} giây.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter ?? 900),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu trường token (OTP 6 chữ số)' },
        { status: 400 }
      );
    }

    const result = await verifyAndEnableMfa(auth.user!.id, token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    await logSecurityEvent({
      userId: auth.user!.id,
      eventType: 'SYSTEM_CONFIG_CHANGE',
      severity: 'MEDIUM',
      ipAddress: getClientIp(request),
      details: { action: 'MFA_ENABLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'MFA đã được bật thành công. Mọi lần đăng nhập tiếp theo sẽ yêu cầu OTP.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xác nhận MFA' },
      { status: 500 }
    );
  }
}
