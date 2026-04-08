
'use client';

import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissionCode?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  permissionCode,
  fallback,
}: ProtectedRouteProps) {
  const { permissions, isLoading, hasPermission, isAdmin } = usePermissions();
  const router = useRouter();
  
  if (isLoading) {
    return fallback ? <>{fallback}</> : null;
  }
  
  if (!permissions) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không có quyền truy cập</h2>
          <p className="text-muted-foreground">Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }
  
  // Admin luôn có quyền
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Check permission if specified
  if (permissionCode && !hasPermission(permissionCode)) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Không có quyền truy cập</h2>
          <p className="text-muted-foreground">Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
