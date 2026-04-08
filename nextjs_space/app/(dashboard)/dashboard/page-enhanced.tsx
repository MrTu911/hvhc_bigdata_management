
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { StatsCard3D } from '@/components/dashboard/stats-card-3d';
import { ServiceStatusChart } from '@/components/dashboard/service-status-chart';
import { ResourceUsageChart } from '@/components/dashboard/resource-usage-chart';
import { RecentLogsTable } from '@/components/dashboard/recent-logs-table';
import { Server, Users, AlertCircle, Activity, TrendingUp, Database, Cpu, HardDrive } from 'lucide-react';

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

export default function DashboardPageEnhanced() {
  const { data: session } = useSession() || {};
  const { t, language } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-8">
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
          subtitle="8GB / 16GB Used"
          icon={Cpu}
          gradient="from-cyan-500 to-cyan-600"
          iconBg="bg-cyan-400/30"
        />
        <StatsCard3D
          title="Storage"
          value={`${Math.round(data?.systemHealth?.diskUsage ?? 0)}%`}
          subtitle="120GB / 500GB Used"
          icon={HardDrive}
          gradient="from-indigo-500 to-indigo-600"
          iconBg="bg-indigo-400/30"
        />
        <StatsCard3D
          title="Performance"
          value="98.5%"
          subtitle="System Uptime"
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
