'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Users, UserPlus, CalendarCheck2, Wallet, ShieldAlert,
  SearchCheck, UserCheck, TrendingUp,
} from 'lucide-react';

function fmt(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  borderCls: string;
  valueCls: string;
  iconBg: string;
}

function KpiCard({ label, value, sub, icon: Icon, borderCls, valueCls, iconBg }: KpiProps) {
  return (
    <Card className={`border-l-4 ${borderCls} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-0.5 ${valueCls}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 flex-shrink-0 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${valueCls}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartyKpiCards({ stats, year }: { stats: any | null; year: number }) {
  const kpi = stats?.kpis || {};
  const total = kpi.totalMembers || 0;
  const chinhThuc = stats?.distributions?.membersByStatus?.['CHINH_THUC'] || 0;
  const duBi = stats?.distributions?.membersByStatus?.['DU_BI'] || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        label="Tổng Đảng viên"
        value={total}
        sub="Toàn học viện"
        icon={Users}
        borderCls="border-l-red-600"
        valueCls="text-red-600"
        iconBg="bg-red-50"
      />
      <KpiCard
        label="Đang sinh hoạt"
        value={chinhThuc}
        sub={`${pct(chinhThuc, total)}% tổng ĐV`}
        icon={UserCheck}
        borderCls="border-l-emerald-500"
        valueCls="text-emerald-600"
        iconBg="bg-emerald-50"
      />
      <KpiCard
        label="Đảng viên Dự bị"
        value={duBi}
        sub="Đang trong thời gian dự bị"
        icon={TrendingUp}
        borderCls="border-l-blue-500"
        valueCls="text-blue-600"
        iconBg="bg-blue-50"
      />
      <KpiCard
        label="Kết nạp trong năm"
        value={kpi.newlyAdmitted || 0}
        sub={`Năm ${year}`}
        icon={UserPlus}
        borderCls="border-l-violet-500"
        valueCls="text-violet-600"
        iconBg="bg-violet-50"
      />
      <KpiCard
        label="Tỷ lệ dự họp"
        value={`${kpi.attendanceRate || 0}%`}
        sub="Trung bình các cuộc họp"
        icon={CalendarCheck2}
        borderCls="border-l-amber-500"
        valueCls="text-amber-600"
        iconBg="bg-amber-50"
      />
      <KpiCard
        label="Nợ Đảng phí"
        value={`${fmt(kpi.totalFeeDebt || 0)}đ`}
        sub={`${kpi.debtMemberCount || 0} đảng viên nợ phí`}
        icon={Wallet}
        borderCls={kpi.debtMemberCount ? 'border-l-orange-500' : 'border-l-slate-300'}
        valueCls={kpi.debtMemberCount ? 'text-orange-600' : 'text-slate-500'}
        iconBg={kpi.debtMemberCount ? 'bg-orange-50' : 'bg-slate-50'}
      />
      <KpiCard
        label="Kỷ luật trong năm"
        value={kpi.disciplineCount || 0}
        sub={kpi.disciplineCount ? 'Cần theo dõi' : 'Không có vi phạm'}
        icon={ShieldAlert}
        borderCls={kpi.disciplineCount ? 'border-l-red-500' : 'border-l-slate-300'}
        valueCls={kpi.disciplineCount ? 'text-red-600' : 'text-slate-500'}
        iconBg={kpi.disciplineCount ? 'bg-red-50' : 'bg-slate-50'}
      />
      <KpiCard
        label="Đợt kiểm tra/giám sát"
        value={kpi.inspectionCount || 0}
        sub="UBKT / kiểm tra nội bộ"
        icon={SearchCheck}
        borderCls="border-l-cyan-500"
        valueCls="text-cyan-600"
        iconBg="bg-cyan-50"
      />
    </div>
  );
}
