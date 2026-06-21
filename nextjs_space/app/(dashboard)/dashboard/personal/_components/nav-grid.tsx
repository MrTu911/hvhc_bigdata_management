'use client';

/**
 * Lưới điều hướng theo loại CSDL — nhóm theo tầng, tô màu theo module nền.
 * Chỉ hiện mục mà người dùng có function-code tương ứng (permission-aware).
 */
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_TOKENS } from '@/lib/constants/module-tokens';
import { PERSONAL_MENU, themeFor } from '@/lib/constants/personal-hub';

export function NavGrid({ permissions }: { permissions: string[] }) {
  const codes = new Set(permissions);

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Điều hướng không gian cá nhân</h2>
      {PERSONAL_MENU.map((group) => {
        const visibleItems = group.items.filter((item) => codes.has(item.code));
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.tier}>
            {group.label && (
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">{group.label}</h3>
                <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500">Tầng {group.tier}</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const theme = themeFor(item.module);
                const moduleCode = MODULE_TOKENS[item.module]?.code ?? '';
                return (
                  <Link key={item.code} href={item.href} className="group">
                    <div
                      className={cn(
                        'flex h-full flex-col rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm',
                        'ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                        theme.topBorder, theme.hoverRing,
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('shrink-0 rounded-lg p-2.5', theme.iconBg, theme.iconText)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-800">{item.title}</h4>
                            {moduleCode && (
                              <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold', theme.chip)}>{moduleCode}</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-end pt-3 text-xs font-medium text-slate-400 group-hover:text-slate-600">
                        Mở <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
