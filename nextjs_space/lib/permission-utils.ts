/**
 * Permission Utilities - Các hàm tiện ích cho RBAC
 *
 * v8.5 UPDATE:
 * - invalidatePermissionCache: Xóa SWR cache sau khi thay đổi quyền
 * - forceRefreshPermissions: Xóa cache + trigger session.update() (JWT refresh)
 * - usePermissionRefresh: React hook kết hợp cả hai
 */

import { mutate } from 'swr';

/**
 * Invalidate SWR permission cache phía client.
 * Gọi sau khi cập nhật RBAC (position, function, user-position).
 * Sidebar sẽ tự re-render với permissions mới từ API.
 */
export async function invalidatePermissionCache(): Promise<void> {
  await mutate('/api/me/permissions', undefined, { revalidate: true });
}

/**
 * React hook: Refresh cả JWT token lẫn SWR cache.
 * Dùng trong các component sau khi thay đổi RBAC để cập nhật ngay lập tức.
 *
 * @example
 *   const { refreshAll } = usePermissionRefresh();
 *   await handleSave();
 *   await refreshAll(); // JWT + SWR đều refresh
 */
export function usePermissionRefresh() {
  // Dynamic import để tránh lỗi server-side
  const refreshAll = async () => {
    // 1. Invalidate SWR cache → sidebar dùng API data sẽ tự cập nhật
    await invalidatePermissionCache();

    // 2. Trigger session.update() để refresh JWT token
    // Dùng dynamic import tránh lỗi SSR
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session) {
        // Gọi fetch để trigger jwt callback với trigger='update'
        await fetch('/api/auth/session', {
          method: 'GET',
          headers: { 'X-Permission-Refresh': '1' },
          cache: 'no-store',
        });
        // Re-invalidate SWR sau JWT update
        await mutate('/api/me/permissions', undefined, { revalidate: true });
      }
    } catch {
      // Ignore - SWR invalidation already done above
    }
  };

  return { refreshAll, invalidate: invalidatePermissionCache };
}

/**
 * Force refresh permissions với cache bust (legacy, dùng cho non-hook context)
 */
export async function forceRefreshPermissions(): Promise<void> {
  try {
    await fetch(`/api/me/permissions?refresh=true&t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    await mutate('/api/me/permissions', undefined, { revalidate: true });
  } catch (error) {
    console.error('Error refreshing permissions:', error);
  }
}

/** @deprecated Use usePermissionRefresh hook instead */
export function shouldRelogin(): boolean {
  return false;
}
