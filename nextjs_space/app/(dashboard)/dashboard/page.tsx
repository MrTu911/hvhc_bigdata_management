
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';
import { StatsCard3D } from '@/components/dashboard/stats-card-3d';
import { ServiceStatusChart } from '@/components/dashboard/service-status-chart';
import { ResourceUsageChart } from '@/components/dashboard/resource-usage-chart';
import { RecentLogsTable } from '@/components/dashboard/recent-logs-table';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Users, AlertCircle, Activity, TrendingUp, Database, Cpu, HardDrive, User, Mail, Shield, Building2, Calendar, ArrowRight } from 'lucide-react';

interface DashboardData {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
  };
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  recentLogs: any[];
}

// Map role to Vietnamese display name
const roleDisplayNames: Record<string, string> = {
  'QUAN_TRI_HE_THONG': 'Quản trị Hệ thống',
  'CHI_HUY_HOC_VIEN': 'Chỉ huy Học viện',
  'CHI_HUY_KHOA_PHONG': 'Chỉ huy Khoa/Phòng',
  'CHU_NHIEM_BO_MON': 'Chủ nhiệm Bộ môn',
  'GIANG_VIEN': 'Giảng viên',
  'NGHIEN_CUU_VIEN': 'Nghiên cứu viên',
  'HOC_VIEN_SINH_VIEN': 'Học viên/Sinh viên',
  'KY_THUAT_VIEN': 'Kỹ thuật viên',
  'ADMIN': 'Quản trị viên',
};

// Map role to dashboard route
const roleRoutes: Record<string, string> = {
  'QUAN_TRI_HE_THONG': '/dashboard/admin',
  'CHI_HUY_HOC_VIEN': '/dashboard/command',
  'CHI_HUY_KHOA_PHONG': '/dashboard/faculty',
  'CHU_NHIEM_BO_MON': '/dashboard/department-head',
  'GIANG_VIEN': '/dashboard/instructor',
  'NGHIEN_CUU_VIEN': '/dashboard/research',
  'HOC_VIEN_SINH_VIEN': '/dashboard/student',
  'KY_THUAT_VIEN': '/dashboard/admin',
  'ADMIN': '/dashboard/admin',
};

export default function DashboardPageEnhanced() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // NO auto-redirect - show profile info first

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.error')}</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role || '';
  const targetDashboard = roleRoutes[userRole] || '/dashboard';
  const roleDisplayName = roleDisplayNames[userRole] || userRole;

  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <DashboardHeader
        title="DASHBOARD TỔNG QUAN"
        subtitle="Hệ thống Quản lý Dữ liệu Lớn - HVHC BigData v8.0"
      />
      
      {/* User Profile Card - Shown First */}
      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary" />
            Thông tin Tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - User Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{session?.user?.name || 'Người dùng'}</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {session?.user?.email || '---'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Vai trò</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {roleDisplayName}
                  </Badge>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Trạng thái</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    Đang hoạt động
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Right Column - Quick Action */}
            <div className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Dashboard theo vai trò</h4>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Truy cập Dashboard chuyên biệt với đầy đủ chức năng dành cho {roleDisplayName}
              </p>
              <Button 
                size="lg"
                onClick={() => router.push(targetDashboard)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Đi đến Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {t('dashboard.welcome')}, {session?.user?.name}! 👋
          </h1>
          <p className="text-white/90 text-lg">
            {language === 'vi' 
              ? 'Tổng quan hệ thống BigData Học viện Hậu cần' 
              : 'HVHC BigData System Overview'}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-white/80">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Cards with 3D Effect */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard3D
          title={t('dashboard.services')}
          value={data?.services?.total ?? 0}
          subtitle={`${data?.services?.healthy ?? 0} ${t('dashboard.healthy').toLowerCase()}`}
          icon={Server}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-400/30"
          trend={{
            value: 12.5,
            isPositive: true,
          }}
        />
        <StatsCard3D
          title={t('dashboard.users')}
          value={data?.users?.total ?? 0}
          subtitle={`${data?.users?.active ?? 0} ${t('dashboard.active').toLowerCase()}`}
          icon={Users}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-400/30"
          trend={{
            value: 8.2,
            isPositive: true,
          }}
        />
        <StatsCard3D
          title={t('dashboard.alerts')}
          value={data?.alerts?.active ?? 0}
          subtitle={`${data?.alerts?.critical ?? 0} ${t('dashboard.critical').toLowerCase()}`}
          icon={AlertCircle}
          gradient="from-orange-500 to-red-500"
          iconBg="bg-orange-400/30"
          trend={{
            value: 3.1,
            isPositive: false,
          }}
        />
        <StatsCard3D
          title={t('dashboard.systemHealth')}
          value={`${Math.round(data?.systemHealth?.cpuUsage ?? 0)}%`}
          subtitle="CPU Usage"
          icon={Activity}
          gradient="from-purple-500 to-purple-600"
          iconBg="bg-purple-400/30"
          trend={{
            value: 5.4,
            isPositive: true,
          }}
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard3D
          title="Memory Usage"
          value={`${Math.round(data?.systemHealth?.memoryUsage ?? 0)}%`}
          subtitle={`${Math.round(data?.systemHealth?.memoryUsage ?? 0)}% đã sử dụng`}
          icon={Cpu}
          gradient="from-cyan-500 to-cyan-600"
          iconBg="bg-cyan-400/30"
        />
        <StatsCard3D
          title="Storage"
          value={`${Math.round(data?.systemHealth?.diskUsage ?? 0)}%`}
          subtitle={`${Math.round(data?.systemHealth?.diskUsage ?? 0)}% đã sử dụng`}
          icon={HardDrive}
          gradient="from-indigo-500 to-indigo-600"
          iconBg="bg-indigo-400/30"
        />
        <StatsCard3D
          title="Performance"
          value={data?.services?.total > 0
            ? `${((data.services.healthy / data.services.total) * 100).toFixed(1)}%`
            : '—'}
          subtitle="Dịch vụ hoạt động"
          icon={TrendingUp}
          gradient="from-green-500 to-green-600"
          iconBg="bg-green-400/30"
        />
      </div>

      {/* Charts with Enhanced Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
          <ServiceStatusChart data={data.services} />
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
          <ResourceUsageChart data={data.systemHealth} />
        </div>
      </div>

      {/* Recent Logs with Enhanced Styling */}
      <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-xl">
        <RecentLogsTable logs={data.recentLogs || []} />
      </div>
    </div>
  );
}
