'use client';

/**
 * /dashboard/settings — Cài đặt tài khoản cá nhân (Tầng 0 — mọi user).
 * Gồm 3 tab: Hồ sơ cá nhân, Giao diện & Ngôn ngữ, Bảo mật.
 * Mỗi tab tự quản lý dữ liệu/fetch của mình; page chỉ lo layout + điều hướng tab.
 */

import { useSession } from 'next-auth/react';
import { Settings, User, Palette, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { useLanguage } from '@/components/providers/language-provider';
import { ProfileSettingsTab } from './_components/profile-settings-tab';
import { AppearanceSettingsTab } from './_components/appearance-settings-tab';
import { SecuritySettingsTab } from './_components/security-settings-tab';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();

  const email = session?.user?.email ?? '—';
  const role = session?.user?.role;
  const roleLabel = role ? t(`role.${role}`) : '—';

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <ModuleHero
          moduleId="admin"
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
          icon={Settings}
          stats={[
            { label: t('settings.field.email'), value: email },
            { label: t('settings.field.role'), value: roleLabel },
          ]}
        />

        <Tabs defaultValue="profile" className="space-y-2">
          <TabsList className="h-auto flex-wrap gap-1 bg-slate-100 p-1 dark:bg-slate-800">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-4 w-4" /> {t('settings.tab.profile')}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="h-4 w-4" /> {t('settings.tab.appearance')}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" /> {t('settings.tab.security')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <ProfileSettingsTab />
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <AppearanceSettingsTab />
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <SecuritySettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
