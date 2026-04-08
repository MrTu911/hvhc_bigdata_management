/**
 * AUTO DASHBOARD - Dashboard tự động theo quyền
 * 
 * Tự động hiển thị widgets dựa trên quyền của user
 * Không cần cấu hình trước
 */

'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { useDashboardStore } from '@/lib/dashboard/dashboard-store';
import {
  WIDGET_REGISTRY,
  getAvailableWidgets,
  getAvailableModules,
  MODULE_INFO,
  generateDefaultLayout,
  type WidgetConfig,
} from '@/lib/dashboard/widget-registry';
import { WidgetRenderer } from './widget-renderer';
import { DashboardBuilder } from './dashboard-builder';
import { LayoutDashboard, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface AutoDashboardProps {
  showBuilder?: boolean;  // Show full builder with edit capabilities
  title?: string;
  description?: string;
}

export function AutoDashboard({ 
  showBuilder = false,
  title = 'Dashboard Tổng quan',
  description = 'Tổng hợp thống kê các CSDL bạn có quyền truy cập',
}: AutoDashboardProps) {
  const { permissions, isAdmin, isLoading, isAuthenticated } = usePermissions();
  const { currentLayout, initializeLayout } = useDashboardStore();

  // Lấy danh sách function codes
  const userFunctions = useMemo(() => {
    if (isAdmin) {
      // Admin có tất cả quyền
      return WIDGET_REGISTRY.map(w => w.requiredFunction);
    }
    return permissions?.functionCodes || [];
  }, [permissions, isAdmin]);

  // Initialize layout khi có permissions
  useEffect(() => {
    if (userFunctions.length > 0 && !currentLayout) {
      initializeLayout(userFunctions);
    }
  }, [userFunctions, currentLayout, initializeLayout]);

  // Widgets có thể hiển thị
  const availableWidgets = useMemo(() => {
    return getAvailableWidgets(userFunctions);
  }, [userFunctions]);

  // Modules có quyền
  const availableModules = useMemo(() => {
    return getAvailableModules(userFunctions);
  }, [userFunctions]);

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Vui lòng đăng nhập để xem Dashboard</p>
        </CardContent>
      </Card>
    );
  }

  // No permissions
  if (availableWidgets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">Chưa có quyền xem CSDL nào</p>
          <p className="text-sm text-muted-foreground">Liên hệ Quản trị viên để được cấp quyền</p>
        </CardContent>
      </Card>
    );
  }

  // Show full builder if requested
  if (showBuilder) {
    return <DashboardBuilder />;
  }

  // Default: Auto-generate dashboard based on permissions
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {availableModules.length} CSDL | {availableWidgets.length} widgets
          </Badge>
          <Button variant="outline" asChild>
            <Link href="/dashboard/my-dashboard">
              <Settings className="h-4 w-4 mr-2" />
              Tùy chỉnh Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Module Summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {availableModules.map(module => {
          const info = MODULE_INFO[module];
          const widgetCount = availableWidgets.filter(w => w.module === module).length;
          const Icon = info?.icon;
          
          return (
            <Card key={module} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn('p-2 rounded-lg bg-gradient-to-br', info?.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{info?.name || module}</p>
                    <p className="text-xs text-muted-foreground">{widgetCount} widgets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableWidgets
            .filter(w => w.type === 'kpi')
            .slice(0, 4)
            .map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {availableWidgets
            .filter(w => w.type === 'pie' || w.type === 'bar')
            .slice(0, 4)
            .map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 gap-4">
          {availableWidgets
            .filter(w => w.type === 'line' || w.type === 'area')
            .slice(0, 2)
            .map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>

        {/* Lists & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {availableWidgets
            .filter(w => w.type === 'list' || w.type === 'table')
            .slice(0, 2)
            .map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export default AutoDashboard;
