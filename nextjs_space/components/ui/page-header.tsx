/**
 * Page Header Component
 * Tiêu đề trang với breadcrumb và actions.
 * Tùy chọn `moduleId`: tô màu icon + nhãn theo loại CSDL (MODULE_TOKENS). Khi không
 * truyền, giữ nguyên màu primary mặc định (không ảnh hưởng các trang đang dùng).
 */

'use client';

import { ReactNode } from 'react';
import { Breadcrumb } from './breadcrumb';
import { cn } from '@/lib/utils';
import { MODULE_TOKENS, type ModuleId } from '@/lib/constants/module-tokens';

/** Sắc icon/nhãn theo loại CSDL (light theme) — class literal để Tailwind JIT quét. */
const MODULE_ICON_ACCENT: Record<ModuleId, { box: string; supra: string }> = {
  personnel:     { box: 'bg-blue-100 text-blue-600',       supra: 'text-blue-600' },
  party:         { box: 'bg-red-100 text-red-600',         supra: 'text-red-600' },
  education:     { box: 'bg-indigo-100 text-indigo-600',   supra: 'text-indigo-600' },
  research:      { box: 'bg-violet-100 text-violet-600',   supra: 'text-violet-600' },
  science:       { box: 'bg-fuchsia-100 text-fuchsia-600', supra: 'text-fuchsia-600' },
  policy:        { box: 'bg-teal-100 text-teal-600',       supra: 'text-teal-600' },
  insurance:     { box: 'bg-emerald-100 text-emerald-600', supra: 'text-emerald-600' },
  student:       { box: 'bg-cyan-100 text-cyan-600',       supra: 'text-cyan-600' },
  admin:         { box: 'bg-slate-100 text-slate-600',     supra: 'text-slate-600' },
  workflow:      { box: 'bg-cyan-100 text-cyan-600',       supra: 'text-cyan-600' },
  bigdata:       { box: 'bg-sky-100 text-sky-600',         supra: 'text-sky-600' },
  notifications: { box: 'bg-indigo-100 text-indigo-600',   supra: 'text-indigo-600' },
  default:       { box: 'bg-blue-100 text-blue-600',       supra: 'text-blue-600' },
};

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbItems?: { label: string; href?: string }[];
  /** Loại CSDL → tô màu icon + hiện nhãn "Mxx · Tên module". Bỏ qua = màu primary. */
  moduleId?: ModuleId;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  breadcrumbItems,
  moduleId,
  className
}: PageHeaderProps) {
  const accent = moduleId ? MODULE_ICON_ACCENT[moduleId] : undefined;
  const token = moduleId ? MODULE_TOKENS[moduleId] : undefined;

  return (
    <div className={cn('space-y-2 mb-6', className)}>
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn('p-2 rounded-lg', accent ? accent.box : 'bg-primary/10 text-primary')}>
              {icon}
            </div>
          )}
          <div>
            {token && accent && (
              <p className={cn('text-[11px] font-semibold uppercase tracking-wider', accent.supra)}>
                {token.code} · {token.label}
              </p>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
