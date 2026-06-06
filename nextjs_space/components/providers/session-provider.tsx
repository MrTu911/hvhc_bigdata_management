
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// Nhận session đã resolve từ server (root layout). Khi truyền sẵn `session`, NextAuth
// dùng làm initial state và KHÔNG fetch /api/auth/session khi mount → hết nhấp nháy auth state.
// Lưu ý: KHÔNG gate bằng `mounted`/`return null`, nếu không server trả <body> rỗng và mất SSR.
export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
