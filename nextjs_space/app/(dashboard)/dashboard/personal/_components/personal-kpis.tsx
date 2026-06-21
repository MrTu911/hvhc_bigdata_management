'use client';

/**
 * Hàng KPI cá nhân — số liệu nhanh theo loại CSDL (đã lọc theo quyền ở backend).
 * Mỗi thẻ là một lối tắt đến trang chi tiết tương ứng.
 */
import Link from 'next/link';
import {
  ClipboardList, UserCheck, FileCheck2, FileEdit, FlaskConical, BookOpen,
  Award, FileText, Shield, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { themeFor } from '@/lib/constants/personal-hub';
import type { PersonalKpi } from '@/lib/types/personal-overview';

const KPI_ICON: Record<string, LucideIcon> = {
  tasks: ClipboardList,
  completion: UserCheck,
  evidence: FileCheck2,
  'change-requests': FileEdit,
  research: FlaskConical,
  publications: BookOpen,
  awards: Award,
  policy: FileText,
  insurance: Shield,
};

export function PersonalKpis({ kpis }: { kpis: PersonalKpi[] }) {
  if (kpis.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">Số liệu nhanh</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = KPI_ICON[kpi.key] ?? ClipboardList;
          const theme = themeFor(kpi.module);
          return (
            <Link key={kpi.key} href={kpi.href} className="group">
              <div className={cn('flex h-full flex-col rounded-xl border border-t-4 border-slate-200 bg-white p-3.5 shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', theme.topBorder, theme.hoverRing)}>
                <div className="flex items-center justify-between">
                  <div className={cn('rounded-lg p-2', theme.iconBg, theme.iconText)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold leading-none text-slate-800">{kpi.value}</span>
                </div>
                <p className="mt-2.5 text-xs font-medium text-slate-600">{kpi.label}</p>
                {kpi.hint && <p className="mt-0.5 text-[11px] font-medium text-amber-600">{kpi.hint}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
