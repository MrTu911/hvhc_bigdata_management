/**
 * POST /api/auth/login — DEPRECATED
 *
 * Route này đã bị gỡ vì:
 * 1. Bypass hoàn toàn MFA check
 * 2. Không tạo AuthSession (UC-06)
 * 3. Không kiểm tra account lock
 * 4. Không cần thiết — NextAuth xử lý đầy đủ
 *
 * Để đăng nhập, dùng NextAuth:
 *   POST /api/auth/callback/credentials
 *   Body: { email, password, otpCode? (nếu MFA enabled) }
 *
 * Để kiểm tra session:
 *   GET /api/auth/session
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint này đã bị gỡ. Vui lòng dùng POST /api/auth/callback/credentials để đăng nhập.',
      alternative: '/api/auth/callback/credentials',
    },
    { status: 410 }
  );
}
