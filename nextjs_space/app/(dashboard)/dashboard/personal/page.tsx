'use client';

/**
 * Trung tâm cá nhân — /dashboard/personal
 *
 * Command center cho không gian cá nhân: danh tính + độ hoàn thiện hồ sơ, dải "Cần xử lý",
 * số liệu nhanh theo loại CSDL, hoạt động gần đây và lưới điều hướng (tô màu theo module nền).
 * Toàn bộ dữ liệu lấy 1 lần từ GET /api/personal/overview (scope SELF, permission-aware).
 */
import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSDL_LEGEND, themeFor } from '@/lib/constants/personal-hub';
import type { PersonalOverview } from '@/lib/types/personal-overview';
import { IdentityHero } from './_components/identity-hero';
import { AttentionStrip } from './_components/attention-strip';
import { PersonalKpis } from './_components/personal-kpis';
import { RecentActivity } from './_components/recent-activity';
import { NavGrid } from './_components/nav-grid';

type LoadState = 'loading' | 'ready' | 'error';

export default function PersonalCenterPage() {
  const [overview, setOverview] = useState<PersonalOverview | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const loadOverview = () => {
    setState('loading');
    fetch('/api/personal/overview')
      .then((r) => r.json())
      .then((res: { success?: boolean; data?: PersonalOverview }) => {
        if (res?.success && res.data) {
          setOverview(res.data);
          setState('ready');
        } else {
          setState('error');
        }
      })
      .catch(() => setState('error'));
  };

  useEffect(loadOverview, []);

  if (state === 'loading') {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (state === 'error' || !overview) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-slate-700">Không tải được trung tâm cá nhân</p>
        <button
          onClick={loadOverview}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <IdentityHero identity={overview.identity} permissions={overview.permissions} />

      <AttentionStrip items={overview.attention} />

      <PersonalKpis kpis={overview.kpis} />

      {/* Hoạt động gần đây + lưới điều hướng */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NavGrid permissions={overview.permissions} />
        </div>
        <div className="xl:col-span-1">
          <RecentActivity items={overview.recentActivity} />
        </div>
      </div>

      {/* Chú giải màu theo loại CSDL */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loại CSDL</span>
        {CSDL_LEGEND.map((l) => (
          <span key={l.module} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className={cn('h-2.5 w-2.5 rounded-full', themeFor(l.module).dot)} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
