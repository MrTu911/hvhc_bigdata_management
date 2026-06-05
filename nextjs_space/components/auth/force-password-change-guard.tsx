'use client';

/**
 * ForcePasswordChangeGuard
 *
 * Khi tài khoản bị đánh dấu buộc đổi mật khẩu (mustChangePassword=true — vd tài khoản
 * cấp sẵn với mật khẩu mặc định), điều hướng người dùng tới trang đổi mật khẩu cho tới
 * khi họ đổi xong. Đọc cờ tươi từ /api/auth/me (tránh stale theo JWT).
 *
 * Mount một lần trong dashboard layout. Sau khi xác nhận không cần đổi, ngừng kiểm tra.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const CHANGE_PASSWORD_PATH = '/dashboard/settings/security';

export function ForcePasswordChangeGuard() {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  // Một khi đã xác nhận không cần đổi (hoặc đã đổi xong), ngừng gọi /api/auth/me mỗi lần điều hướng.
  const clearedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || clearedRef.current) return;
    // Đang ở chính trang đổi mật khẩu thì không can thiệp.
    if (pathname === CHANGE_PASSWORD_PATH) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.mustChangePassword) {
          router.replace(`${CHANGE_PASSWORD_PATH}?forceChange=1`);
        } else {
          clearedRef.current = true;
        }
      } catch {
        // Lỗi mạng — bỏ qua, sẽ thử lại ở lần điều hướng kế tiếp.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, pathname, router]);

  return null;
}
