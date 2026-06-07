'use client';

/**
 * M13 – My Work KPI Cards
 * Hiển thị 5 KPI chính: chờ xử lý, sắp hạn, quá hạn, đã khởi tạo, đã hoàn thành.
 * Props-based — không fetch data trực tiếp, nhận từ page parent.
 */

import { Card, CardContent } from '@/components/ui/card';
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

type KpiColor = 'blue' | 'amber' | 'red' | 'violet' | 'green';

const COLOR_STYLES: Record<KpiColor, { bar: string; icon: string; value: string; ring: string }> = {
  blue:   { bar: 'bg-blue-500',   icon: 'bg-blue-50 text-blue-600',     value: 'text-blue-600',   ring: '' },
  amber:  { bar: 'bg-amber-500',  icon: 'bg-amber-50 text-amber-600',   value: 'text-amber-600',  ring: 'ring-1 ring-amber-100' },
  red:    { bar: 'bg-red-500',    icon: 'bg-red-50 text-red-600',       value: 'text-red-600',    ring: 'ring-1 ring-red-200' },
  violet: { bar: 'bg-violet-500', icon: 'bg-violet-50 text-violet-600', value: 'text-violet-600', ring: '' },
  green:  { bar: 'bg-green-500',  icon: 'bg-green-50 text-green-600',    value: 'text-green-600',  ring: '' },
};

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  color: KpiColor;
  /** Tô đậm giá trị + viền nhấn khi có số liệu cần chú ý (quá hạn / sắp hạn) */
  emphasize?: boolean;
}

function KpiCard({ title, value, subtitle, icon: Icon, color, emphasize }: KpiCardProps) {
  const styles = COLOR_STYLES[color];
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200',
        emphasize && styles.ring,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
            <p className={cn('text-3xl font-bold leading-none', emphasize ? styles.value : 'text-slate-800')}>
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>
          </div>
          <div className={cn('rounded-xl p-2.5', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', styles.bar)} />
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
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-12 mb-2" />
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
        color="blue"
        emphasize={stats.pendingCount > 0}
      />
      <KpiCard
        title="Sắp đến hạn"
        value={stats.nearDueCount}
        subtitle="trong 24 giờ tới"
        icon={AlertTriangle}
        color="amber"
        emphasize={stats.nearDueCount > 0}
      />
      <KpiCard
        title="Quá hạn"
        value={stats.overdueCount}
        subtitle="cần xử lý ngay"
        icon={AlertCircle}
        color="red"
        emphasize={stats.overdueCount > 0}
      />
      <KpiCard
        title="Tôi khởi tạo"
        value={stats.initiatedCount}
        subtitle="đang trong quy trình"
        icon={FilePlus}
        color="violet"
      />
      <KpiCard
        title="Hoàn thành gần đây"
        value={stats.completedRecentCount}
        subtitle="trong 7 ngày qua"
        icon={CheckCircle2}
        color="green"
        emphasize={stats.completedRecentCount > 0}
      />
    </div>
  );
}
