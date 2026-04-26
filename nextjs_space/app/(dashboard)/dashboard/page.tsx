
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import useSWR from 'swr';
import { useLanguage } from '@/components/providers/language-provider';
import { StatsCard3D } from '@/components/dashboard/stats-card-3d';
import { ServiceStatusChart } from '@/components/dashboard/service-status-chart';
import { ResourceUsageChart } from '@/components/dashboard/resource-usage-chart';
import { RecentLogsTable } from '@/components/dashboard/recent-logs-table';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Users, AlertCircle, Activity, TrendingUp, Cpu, HardDrive, User, Mail, Shield, ArrowRight, RefreshCw, LogOut } from 'lucide-react';

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

// Map positionCode/role → tên hiển thị tiếng Việt
const positionDisplayNames: Record<string, string> = {
  // New position codes
  'SYSTEM_ADMIN':      'Quản trị Hệ thống',
  'PHO_GIAM_DOC':      'Phó Giám đốc Học viện',
  'GIAM_DOC':          'Giám đốc Học viện',
  'CHINH_UY':          'Chính ủy',
  'TRUONG_KHOA':       'Trưởng Khoa',
  'CHU_NHIEM_BO_MON':  'Chủ nhiệm Bộ môn',
  'GIANG_VIEN':        'Giảng viên',
  'NGHIEN_CUU_VIEN':   'Nghiên cứu viên',
  'NHAN_VIEN':         'Nhân viên',
  'HOC_VIEN_QUAN_SU':  'Học viên Quân sự',
  'SINH_VIEN_DAN_SU':  'Sinh viên Dân sự',
  // Legacy role strings (backward compat)
  'QUAN_TRI_HE_THONG': 'Quản trị Hệ thống',
  'CHI_HUY_HOC_VIEN':  'Chỉ huy Học viện',
  'CHI_HUY_KHOA_PHONG':'Chỉ huy Khoa/Phòng',
  'HOC_VIEN_SINH_VIEN':'Học viên/Sinh viên',
  'KY_THUAT_VIEN':     'Kỹ thuật viên',
  'ADMIN':             'Quản trị viên',
};

const swrFetcher = (url: string) => fetch(url).then(r => r.json());

// Position codes có quyền xem trang system overview này
const ADMIN_POSITIONS = new Set([
  'SYSTEM_ADMIN', 'PHO_GIAM_DOC', 'GIAM_DOC', 'CHINH_UY', 'PHO_CHINH_UY',
  // legacy role strings
  'ADMIN', 'QUAN_TRI_HE_THONG', 'CHI_HUY_HOC_VIEN',
]);

// Map positionCode → route dashboard chuyên biệt (dùng session trực tiếp, không cần API)
function resolveRedirectFromSession(positionCode: string | null | undefined, legacyRole?: string): string | null {
  const code = positionCode ?? legacyRole ?? '';
  if (!code) return null;
  if (['TRUONG_KHOA', 'PHO_TRUONG_KHOA', 'CHU_NHIEM_BO_MON', 'GIANG_VIEN', 'NGHIEN_CUU_VIEN',
       'CHI_HUY_KHOA_PHONG', 'CHI_HUY_HE', 'CHI_HUY_TIEU_DOAN', 'CHI_HUY_BAN'].includes(code)) {
    return '/dashboard/faculty';
  }
  if (['HOC_VIEN_QUAN_SU', 'SINH_VIEN_DAN_SU', 'HOC_VIEN', 'HOC_VIEN_SINH_VIEN'].includes(code)) {
    return '/dashboard/student';
  }
  if (['NHAN_VIEN', 'KY_THUAT_VIEN'].includes(code)) return '/dashboard/personal';
  return null;
}

type FetchStatus = 'loading' | 'ok' | 'forbidden' | 'error';

export default function DashboardPageEnhanced() {
  const { data: session, update: updateSession } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dùng để lấy redirectTo khi cần (ví dụ: khi forbidden, hiển thị nút "Đi đến dashboard của tôi")
  const { data: dashboardMe } = useSWR('/api/dashboard/me', swrFetcher);

  // Early redirect: non-admin users không nên ở trang system overview này
  // Dùng session.user.primaryPositionCode (sync, không cần API call)
  useEffect(() => {
    if (!session?.user) return;
    const posCode = session.user.primaryPositionCode;
    const legacyRole = session.user.role;
    // Nếu là admin/executive → ở lại trang này
    if (ADMIN_POSITIONS.has(posCode ?? '') || ADMIN_POSITIONS.has(legacyRole ?? '')) return;
    // Các role khác → redirect ngay
    const target = resolveRedirectFromSession(posCode, legacyRole);
    if (target) {
      router.replace(target);
    }
  }, [session?.user, router]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setFetchStatus('ok');
      } else if (response.status === 403 || response.status === 401) {
        setFetchStatus('forbidden');
      } else {
        setFetchStatus('error');
      }
    } catch {
      setFetchStatus('error');
    }
  }, []);

  // Chỉ fetch stats khi session đã load và user là admin/executive
  useEffect(() => {
    if (!session?.user) return;
    const posCode = session.user.primaryPositionCode;
    const legacyRole = session.user.role;
    if (!ADMIN_POSITIONS.has(posCode ?? '') && !ADMIN_POSITIONS.has(legacyRole ?? '')) return;

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [session?.user, fetchStats]);

  const handleRefreshSession = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await updateSession();
      await fetchStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (fetchStatus === 'loading') {
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

  if (fetchStatus === 'forbidden') {
    const targetDashboard = dashboardMe?.data?.redirectTo;
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phiên làm việc cần cập nhật quyền</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Quyền truy cập của bạn đã được cập nhật nhưng phiên làm việc hiện tại chưa được đồng bộ.
            Vui lòng thử làm mới phiên hoặc đăng nhập lại.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang làm mới...' : 'Làm mới phiên'}
            </Button>
            {targetDashboard && (
              <Button variant="outline" onClick={() => router.push(targetDashboard)} className="gap-2">
                Đi đến Dashboard của tôi
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Đăng nhập lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchStatus === 'error' || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.error')}</p>
          <Button variant="outline" onClick={fetchStats} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Ưu tiên redirectTo từ API (dùng primaryPositionCode), fallback về personal
  const targetDashboard = dashboardMe?.data?.redirectTo || '/dashboard/personal';

  // Hiển thị tên chức vụ: ưu tiên primaryPositionCode mới, fallback về legacy role
  const positionCode = session?.user?.primaryPositionCode || session?.user?.role || '';
  const roleDisplayName = positionDisplayNames[positionCode] || positionCode || 'Người dùng';

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
