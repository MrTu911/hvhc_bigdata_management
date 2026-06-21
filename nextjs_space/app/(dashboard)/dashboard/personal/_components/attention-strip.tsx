'use client';

/**
 * Dải "Cần xử lý" — việc cần hành động ngay, sắp theo mức độ (critical → info).
 * Khi không có việc nào → hiện trạng thái rỗng tích cực.
 */
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PersonalAttentionItem } from '@/lib/types/personal-overview';

const SEVERITY_STYLE: Record<PersonalAttentionItem['severity'], { wrap: string; icon: typeof Info; iconColor: string; action: string }> = {
  critical: { wrap: 'border-red-200 bg-red-50',      icon: AlertTriangle, iconColor: 'text-red-600',    action: 'bg-red-600 hover:bg-red-700 text-white' },
  warning:  { wrap: 'border-amber-200 bg-amber-50',  icon: AlertCircle,   iconColor: 'text-amber-600',  action: 'bg-amber-500 hover:bg-amber-600 text-white' },
  info:     { wrap: 'border-blue-200 bg-blue-50',    icon: Info,          iconColor: 'text-blue-600',   action: 'bg-blue-600 hover:bg-blue-700 text-white' },
};

export function AttentionStrip({ items }: { items: PersonalAttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Không có việc cần xử lý</p>
            <p className="text-xs text-emerald-700">Hồ sơ và công việc của bạn đang ở trạng thái tốt.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Cần xử lý</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{items.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const s = SEVERITY_STYLE[item.severity];
          const Icon = s.icon;
          return (
            <div key={item.key} className={cn('flex items-start gap-3 rounded-xl border p-4', s.wrap)}>
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', s.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className={cn('inline-flex shrink-0 items-center gap-1 self-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', s.action)}
              >
                {item.actionLabel}<ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
