'use client';

/**
 * M13 – My Work KPI Cards
 * Hiển thị 5 KPI chính: chờ xử lý, sắp hạn, quá hạn, đã khởi tạo, đã hoàn thành.
 * Props-based — không fetch data trực tiếp, nhận từ page parent.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  FilePlus,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';

export interface WorkflowMyWorkStats {
  pendingCount: number;
  nearDueCount: number;
  overdueCount: number;
  initiatedCount: number;
  completedRecentCount: number;
}

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  variant: 'default' | 'warning' | 'danger' | 'success';
}

const VARIANT_STYLES: Record<KpiCardProps['variant'], { icon: string; badge: string }> = {
  default: { icon: 'bg-primary/10 text-primary', badge: '' },
  warning: { icon: 'bg-amber-100 text-amber-600', badge: '' },
  danger:  { icon: 'bg-red-100 text-red-600', badge: '' },
  success: { icon: 'bg-green-100 text-green-600', badge: '' },
};

function KpiCard({ title, value, subtitle, icon: Icon, variant }: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center', styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'text-3xl font-bold',
          variant === 'danger' && value > 0 ? 'text-red-600' : '',
          variant === 'warning' && value > 0 ? 'text-amber-600' : '',
        )}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface WorkflowKpiCardsProps {
  stats: WorkflowMyWorkStats | null;
  loading: boolean;
}

export function WorkflowKpiCards({ stats, loading }: WorkflowKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard
        title="Chờ tôi xử lý"
        value={stats.pendingCount}
        subtitle="bước đang gán cho bạn"
        icon={Clock}
        variant={stats.pendingCount > 0 ? 'default' : 'default'}
      />
      <KpiCard
        title="Sắp đến hạn"
        value={stats.nearDueCount}
        subtitle="trong 24 giờ tới"
        icon={AlertTriangle}
        variant={stats.nearDueCount > 0 ? 'warning' : 'default'}
      />
      <KpiCard
        title="Quá hạn"
        value={stats.overdueCount}
        subtitle="cần xử lý ngay"
        icon={AlertCircle}
        variant={stats.overdueCount > 0 ? 'danger' : 'default'}
      />
      <KpiCard
        title="Tôi khởi tạo"
        value={stats.initiatedCount}
        subtitle="đang trong quy trình"
        icon={FilePlus}
        variant="default"
      />
      <KpiCard
        title="Hoàn thành gần đây"
        value={stats.completedRecentCount}
        subtitle="trong 7 ngày qua"
        icon={CheckCircle2}
        variant={stats.completedRecentCount > 0 ? 'success' : 'default'}
      />
    </div>
  );
}
