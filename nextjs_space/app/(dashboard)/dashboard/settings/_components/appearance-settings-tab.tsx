'use client';

/**
 * AppearanceSettingsTab — Chọn chủ đề (sáng/tối/hệ thống) và ngôn ngữ (vi/en).
 * Tiêu thụ next-themes (useTheme) và LanguageProvider (useLanguage) — persist sẵn,
 * không tạo nguồn lưu trữ mới. Guard `mounted` để tránh hydration mismatch của next-themes.
 */

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Palette, Languages, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';

type ThemeOption = { value: string; labelKey: string; icon: LucideIcon };

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', labelKey: 'settings.appearance.theme.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.appearance.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.appearance.theme.system', icon: Monitor },
];

type LangOption = { value: 'vi' | 'en'; labelKey: string };

const LANG_OPTIONS: LangOption[] = [
  { value: 'vi', labelKey: 'settings.appearance.lang.vi' },
  { value: 'en', labelKey: 'settings.appearance.lang.en' },
];

export function AppearanceSettingsTab() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Chủ đề giao diện */}
      <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-500" /> {t('settings.appearance.themeTitle')}
          </CardTitle>
          <CardDescription>{t('settings.appearance.themeDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((o) => <Skeleton key={o.value} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((option) => {
                const active = theme === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-2 rounded-xl border p-5 transition-all',
                      active
                        ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20 dark:border-slate-200 dark:bg-slate-800'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
                    )}
                  >
                    {active && <Check className="absolute right-2 top-2 h-4 w-4 text-slate-700 dark:text-slate-200" />}
                    <Icon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t(option.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ngôn ngữ */}
      <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4 text-slate-500" /> {t('settings.appearance.langTitle')}
          </CardTitle>
          <CardDescription>{t('settings.appearance.langDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            {LANG_OPTIONS.map((option) => {
              const active = language === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={cn(
                    'relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all',
                    active
                      ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20 dark:border-slate-200 dark:bg-slate-800'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
                  )}
                >
                  {active && <Check className="h-4 w-4 text-slate-700 dark:text-slate-200" />}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
