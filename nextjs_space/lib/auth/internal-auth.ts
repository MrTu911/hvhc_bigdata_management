/**
 * Internal API authentication – M18
 *
 * Dùng cho service-to-service calls (M10/M13/M15 → M18).
 * Xác thực bằng Bearer token khớp với INTERNAL_API_SECRET env var.
 * Không dùng RBAC position — đây là machine-to-machine auth.
 */

import { NextRequest } from 'next/server';

export interface InternalAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Kiểm tra token từ Authorization header.
 * Returns { authorized: true } nếu hợp lệ.
 * Returns { authorized: false, reason } nếu không hợp lệ.
 */
export function verifyInternalToken(request: NextRequest): InternalAuthResult {
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    // Nếu chưa cấu hình secret thì từ chối toàn bộ — fail-safe
    console.warn('[internal-auth] INTERNAL_API_SECRET chưa được cấu hình');
    return { authorized: false, reason: 'Internal API chưa được cấu hình' };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { authorized: false, reason: 'Thiếu Authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { authorized: false, reason: 'Authorization header phải có dạng Bearer <token>' };
  }

  const token = authHeader.slice(7).trim();
  if (token !== secret) {
    return { authorized: false, reason: 'Token không hợp lệ' };
  }

  return { authorized: true };
}
