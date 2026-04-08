/**
 * MY DASHBOARD PAGE - Trang tùy chỉnh Dashboard cá nhân
 * 
 * Cho phép user tự tạo dashboard theo ý thích
 */

'use client';

import { useEffect } from 'react';
import { DashboardBuilder } from '@/components/dashboard/dashboard-builder';
import { usePermissions } from '@/hooks/use-permissions';
import { useDashboardStore } from '@/lib/dashboard/dashboard-store';
import { WIDGET_REGISTRY } from '@/lib/dashboard/widget-registry';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyDashboardPage() {
  const { permissions, isAdmin, isLoading } = usePermissions();
  const { initializeLayout, currentLayout } = useDashboardStore();

  // Initialize layout
  useEffect(() => {
    if (!isLoading) {
      const functions = isAdmin 
        ? WIDGET_REGISTRY.map(w => w.requiredFunction)
        : (permissions?.functionCodes || []);
      
      if (!currentLayout && functions.length > 0) {
        initializeLayout(functions);
      }
    }
  }, [isLoading, isAdmin, permissions, currentLayout, initializeLayout]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Cá nhân</h1>
        <p className="text-muted-foreground mt-1">
          Tùy chỉnh dashboard theo ý thích của bạn
        </p>
      </div>
      
      <DashboardBuilder />
    </div>
  );
}
