/**
 * Permission Utilities - Các hàm tiện ích cho RBAC
 *
 * v8.9 UPDATE:
 * - usePermissionRefresh: hook dùng useSession().update() thực sự trigger JWT refresh
 * - invalidatePermissionCache: xóa SWR cache sau khi thay đổi quyền
 */

import { mutate } from 'swr';
import { useSession } from 'next-auth/react';

/**
 * Invalidate SWR permission cache phía client.
 * Gọi sau khi cập nhật RBAC để sidebar re-fetch permissions mới từ API.
 */
export async function invalidatePermissionCache(): Promise<void> {
  await mutate('/api/me/permissions', undefined, { revalidate: true });
}

/**
 * React hook: Refresh JWT token + SWR cache sau khi thay đổi RBAC.
 *
 * Cách hoạt động:
 * 1. session.update() → trigger JWT callback với trigger='update'
 *    → auth.ts re-load functionCodes từ DB → ghi vào token mới
 * 2. mutate('/api/me/permissions') → SWR re-fetch → usePermissions trả data mới
 *
 * @example
 *   const { refreshAll } = usePermissionRefresh();
 *   await handleSave();
 *   refreshAll(); // không cần await — fire-and-forget để không block UI
 */
export function usePermissionRefresh() {
  const { update: updateSession } = useSession();

  const refreshAll = async () => {
    try {
      // Bước 1: Trigger JWT callback với trigger='update' — auth.ts sẽ re-query DB
      await updateSession();
    } catch {
      // updateSession không critical — SWR vẫn đủ để update permissions
    }
    // Bước 2: Force SWR re-fetch /api/me/permissions → usePermissions nhận data mới
    await mutate('/api/me/permissions', undefined, { revalidate: true });
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
