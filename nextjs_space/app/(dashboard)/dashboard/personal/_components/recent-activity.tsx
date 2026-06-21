'use client';

/**
 * Hoạt động gần đây — gộp đề nghị cập nhật, công việc đang chờ và khen thưởng,
 * sắp theo thời gian. Mỗi dòng dẫn đến trang chi tiết.
 */
import Link from 'next/link';
import { FileEdit, ClipboardList, Award, ArrowRight, History, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { themeFor } from '@/lib/constants/personal-hub';
import type { PersonalActivityItem } from '@/lib/types/personal-overview';

const KIND_ICON: Record<PersonalActivityItem['kind'], LucideIcon> = {
  CHANGE_REQUEST: FileEdit,
  TASK: ClipboardList,
  AWARD: Award,
};

/** Nhãn trạng thái đề nghị cập nhật hồ sơ (ProfileChangeRequestStatus). */
const CHANGE_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT:         { label: 'Nháp',          cls: 'bg-slate-100 text-slate-600' },
  SUBMITTED:     { label: 'Chờ cấp 1',     cls: 'bg-amber-100 text-amber-700' },
  UNIT_APPROVED: { label: 'Chờ cấp 2',     cls: 'bg-amber-100 text-amber-700' },
  APPROVED:      { label: 'Đã duyệt',      cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED:      { label: 'Từ chối',       cls: 'bg-red-100 text-red-700' },
  RETURNED:      { label: 'Trả lại',       cls: 'bg-red-100 text-red-700' },
  CANCELLED:     { label: 'Đã hủy',        cls: 'bg-slate-100 text-slate-500' },
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function statusBadge(item: PersonalActivityItem) {
  if (item.kind === 'CHANGE_REQUEST' && item.status) {
    return CHANGE_STATUS_LABEL[item.status] ?? { label: item.status, cls: 'bg-slate-100 text-slate-600' };
  }
  if (item.kind === 'TASK') {
    return item.status === 'Quá hạn'
      ? { label: 'Quá hạn', cls: 'bg-red-100 text-red-700' }
      : { label: 'Đang chờ', cls: 'bg-cyan-100 text-cyan-700' };
  }
  if (item.kind === 'AWARD' && item.status) {
    return { label: `Năm ${item.status}`, cls: 'bg-teal-100 text-teal-700' };
  }
  return null;
}

export function RecentActivity({ items }: { items: PersonalActivityItem[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Hoạt động gần đây</h2>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">Chưa có hoạt động nào gần đây.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const Icon = KIND_ICON[item.kind];
              const theme = themeFor(item.module);
              const badge = statusBadge(item);
              return (
                <li key={item.id}>
                  <Link href={item.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                    <div className={cn('shrink-0 rounded-lg p-2', theme.iconBg, theme.iconText)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400">{formatWhen(item.at)}</p>
                    </div>
                    {badge && <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', badge.cls)}>{badge.label}</span>}
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
