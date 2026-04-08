
'use client';

import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('nav.settings')}</h2>
        <p className="text-muted-foreground mt-1">
          {language === 'vi' 
            ? 'Cấu hình hệ thống' 
            : 'System configuration'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {language === 'vi' ? 'Cài đặt' : 'Settings'}
          </CardTitle>
          <CardDescription>
            {language === 'vi' 
              ? 'Quản lý cấu hình hệ thống' 
              : 'Manage system configuration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {language === 'vi' 
              ? 'Trang cài đặt sẽ cho phép cấu hình các tham số hệ thống, kết nối BigData services, và các thiết lập khác.' 
              : 'Settings page will allow configuration of system parameters, BigData service connections, and other settings.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
