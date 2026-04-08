/**
 * M01 – UC-01: MFA Setup
 * POST /api/auth/mfa/setup
 * → Tạo secret + QR code để user cấu hình Authenticator app
 *
 * Sau khi quét QR, user phải gọi POST /api/auth/mfa/verify để xác nhận
 * trước khi MFA thực sự được bật.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac/middleware';
import { generateMfaSecret } from '@/lib/services/auth/mfa.service';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.allowed) return auth.response!;

  try {
    const result = await generateMfaSecret(auth.user!.id);

    return NextResponse.json({
      success: true,
      data: {
        // Secret chỉ hiển thị một lần — user cần lưu lại nếu muốn backup
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
        qrCodeDataUrl: result.qrCodeDataUrl,
      },
      message: 'Quét QR bằng Authenticator app, sau đó xác nhận bằng /api/auth/mfa/verify',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khởi tạo MFA' },
      { status: 500 }
    );
  }
}
