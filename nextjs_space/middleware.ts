/**
 * MIDDLEWARE v8.3 - AUTHENTICATION GATE ONLY
 * 
 * Nguyên tắc:
 * 1. KHÔNG kiểm tra role/permission ở đây
 * 2. CHỈ kiểm tra: đã login chưa?
 * 3. Authorization được xử lý bởi API routes (requireFunction middleware)
 * 4. Exclude /api để tránh redirect API requests
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders } from '@/lib/security/security-headers';

// Routes yêu cầu authentication
const protectedPrefixes = ['/dashboard'];

// Routes public (không cần đăng nhập)
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Kiểm tra có phải protected route không
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/');

  // Helper: tạo response với security headers
  const withHeaders = (res: ReturnType<typeof NextResponse.next | typeof NextResponse.redirect>) => {
    applySecurityHeaders(res.headers);
    return res;
  };

  // Nếu là public route hoặc API, cho phép đi tiếp
  if (isPublicRoute && !isProtectedRoute) {
    return withHeaders(NextResponse.next());
  }

  // 2. Lấy token
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. Chưa đăng nhập + truy cập protected route => redirect login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return withHeaders(NextResponse.redirect(url));
  }

  // 4. Đã đăng nhập + truy cập /login => redirect /dashboard
  if (token && pathname === '/login') {
    return withHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  // 5. Cho phép đi tiếp - authorization sẽ được kiểm tra ở API/page level
  return withHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (ALL API routes - authorization handled by API middleware)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     * - baocao.html (static report embedded via iframe, headers handled by next.config.js)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|baocao\\.html|reports/baocao\\.html).*)',
  ],
};
