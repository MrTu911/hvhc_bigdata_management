/**
 * Dynamic Dashboard - Hiển thị dashboard theo quyền user
 * 
 * THỨ TỰ Ư U TIÊN:
 * 1. SYSTEM_ADMIN → Admin Dashboard
 * 2. VIEW_DASHBOARD_COMMAND → Command Dashboard
 * 3. VIEW_DASHBOARD_FACULTY → Faculty Dashboard
 * 4. VIEW_DASHBOARD_STUDENT → Student Dashboard
 * 5. VIEW_DASHBOARD → Basic Dashboard
 * 6. Fallback → Empty State
 */

'use client';

import { useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { DASHBOARD, SYSTEM } from '@/lib/rbac/function-codes';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Dashboard component mapping
interface DashboardConfig {
  function: string;
  priority: number;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

const DASHBOARD_CONFIGS: DashboardConfig[] = [
  {
    function: DASHBOARD.VIEW_ADMIN,
    priority: 100,
    title: 'Dashboard Quản trị Hệ thống',
    description: 'Quản lý toàn bộ hệ thống, người dùng, phân quyền',
    href: '/dashboard/admin',
    gradient: 'from-red-500 to-red-600',
  },
  {
    function: DASHBOARD.VIEW_COMMAND,
    priority: 90,
    title: 'Dashboard Chỉ huy',
    description: 'Tổng quan quân số, đào tạo, huấn luyện toàn Học viện',
    href: '/dashboard/command',
    gradient: 'from-yellow-600 to-amber-600',
  },
  {
    function: DASHBOARD.VIEW_FACULTY,
    priority: 70,
    title: 'Dashboard Giảng viên',
    description: 'Thống kê giảng dạy, hướng dẫn học viên, nghiên cứu',
    href: '/dashboard/faculty',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    function: DASHBOARD.VIEW_STUDENT,
    priority: 60,
    title: 'Dashboard Học viên',
    description: 'Kết quả học tập, lịch học, thông báo',
    href: '/dashboard/student',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    function: DASHBOARD.VIEW,
    priority: 50,
    title: 'Dashboard Tổng quan',
    description: 'Thông tin cơ bản hệ thống',
    href: '/dashboard',
    gradient: 'from-blue-500 to-blue-600',
  },
];

export function DynamicDashboard() {
  const { hasPermission, isAdmin, isLoading, isAuthenticated } = usePermissions();

  const availableDashboard = useMemo(() => {
    if (!isAuthenticated) return null;
    if (isAdmin) return DASHBOARD_CONFIGS[0]; // Admin dashboard

    // Tìm dashboard có priority cao nhất mà user có quyền
    const sorted = [...DASHBOARD_CONFIGS].sort((a, b) => b.priority - a.priority);
    for (const config of sorted) {
      if (hasPermission(config.function)) {
        return config;
      }
    }
    return null;
  }, [isAuthenticated, isAdmin, hasPermission]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // No permission
  if (!availableDashboard) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Chưa được cấp quyền Dashboard</CardTitle>
          <CardDescription>
            Tài khoản của bạn chưa được cấp quyền truy cập bất kỳ Dashboard nào.
            Vui lòng liên hệ Quản trị viên để được hỗ trợ.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard/profile">
              Xem hồ sơ cá nhân
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Redirect card to available dashboard
  return (
    <Card className={`bg-gradient-to-r ${availableDashboard.gradient} text-white`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-white">{availableDashboard.title}</CardTitle>
            <CardDescription className="text-white/80">
              {availableDashboard.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" asChild>
          <Link href={availableDashboard.href}>
            Truy cập Dashboard
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * List tất cả dashboards có thể truy cập
 */
export function DashboardList() {
  const { hasPermission, isAdmin, isLoading, isAuthenticated } = usePermissions();

  const availableDashboards = useMemo(() => {
    if (!isAuthenticated) return [];
    if (isAdmin) return DASHBOARD_CONFIGS;

    return DASHBOARD_CONFIGS.filter(config => hasPermission(config.function));
  }, [isAuthenticated, isAdmin, hasPermission]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (availableDashboards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Không có Dashboard nào được cấp quyền
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {availableDashboards.map(config => (
        <Link key={config.function} href={config.href}>
          <Card className={`h-full hover:shadow-lg transition-shadow bg-gradient-to-br ${config.gradient} text-white`}>
            <CardHeader>
              <CardTitle className="text-lg text-white">{config.title}</CardTitle>
              <CardDescription className="text-white/80">
                {config.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
