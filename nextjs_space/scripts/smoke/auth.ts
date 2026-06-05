/**
 * Smoke harness – đăng nhập NextAuth (credentials) bằng cookie jar thủ công.
 *
 * Luồng: GET /api/auth/csrf -> POST /api/auth/callback/credentials -> /api/auth/session.
 * Trả về chuỗi Cookie để các request smoke kế thừa phiên admin (full menu).
 *
 * Lưu ý: /api/auth/login là stub 410 — KHÔNG dùng. Admin demo mfaEnabled=false
 * nên không cần otpCode.
 */

export const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL ?? 'admin@hvhc.edu.vn';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'Hv@2025';

type CookieJar = Map<string, string>;

function cookieHeader(jar: CookieJar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeSetCookies(jar: CookieJar, res: Response): void {
  // getSetCookie() có sẵn trên undici (Node 18.14+)
  const setCookies: string[] = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const line of setCookies) {
    const firstPair = line.split(';')[0];
    const eq = firstPair.indexOf('=');
    if (eq === -1) continue;
    const name = firstPair.slice(0, eq).trim();
    const value = firstPair.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }
}

export interface SmokeSession {
  cookie: string;
  role: string;
}

export async function loginAsAdmin(): Promise<SmokeSession> {
  const jar: CookieJar = new Map();

  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  storeSetCookies(jar, csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  if (!csrfToken) throw new Error('Không lấy được csrfToken từ /api/auth/csrf');

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    callbackUrl: BASE_URL,
    json: 'true',
  });
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: cookieHeader(jar),
    },
    body: body.toString(),
    redirect: 'manual',
  });
  storeSetCookies(jar, loginRes);

  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const session = (await sessionRes.json()) as { user?: { role?: string } };
  if (!session?.user) {
    throw new Error(
      `Đăng nhập thất bại (không có session.user). Kiểm tra DB đã seed admin (${EMAIL}) và mật khẩu chưa.`,
    );
  }

  return { cookie: cookieHeader(jar), role: session.user.role ?? 'UNKNOWN' };
}
