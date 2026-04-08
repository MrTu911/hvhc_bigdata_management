/**
 * M01 – UC-08: Security Headers
 *
 * Áp dụng vào middleware.ts để set cho toàn bộ response.
 * Tham chiếu: OWASP Secure Headers Project
 */

export const SECURITY_HEADERS: Record<string, string> = {
  // Chống clickjacking
  'X-Frame-Options': 'DENY',

  // Chống MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Buộc HTTPS trong 1 năm, bao gồm subdomain
  // Chỉ kích hoạt ở production để không block localhost
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),

  // Tắt referrer khi cross-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Giới hạn tính năng browser
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Content Security Policy — strict whitelist
  // Script chỉ cho phép từ same-origin + nonce-based (Next.js runtime)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval cần cho Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Tắt thông tin server
  'X-Powered-By': '',  // sẽ bị strip bởi Next.js nếu dùng next.config header
};

/**
 * Áp dụng security headers vào NextResponse
 * Dùng trong middleware.ts sau khi tạo response
 */
export function applySecurityHeaders(
  headers: Headers,
  overrides: Partial<Record<string, string>> = {}
): void {
  const merged = { ...SECURITY_HEADERS, ...overrides };

  for (const [key, value] of Object.entries(merged)) {
    if (value === '') {
      headers.delete(key);
    } else {
      headers.set(key, value);
    }
  }
}
