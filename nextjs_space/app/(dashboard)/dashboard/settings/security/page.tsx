'use client';

/**
 * /dashboard/settings/security
 * Bảo mật tài khoản: đổi mật khẩu, xem phiên đăng nhập.
 * Yêu cầu: MANAGE_MY_SECURITY (Tầng 0 — MỌI user)
 *
 * Logic được tách thành các component dùng chung trong ../_components để
 * tái sử dụng tại trang /dashboard/settings (tab Bảo mật).
 */

import { ShieldCheck } from 'lucide-react';
import { ChangePasswordCard } from '../_components/change-password-card';
import { SessionsCard } from '../_components/sessions-card';

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Bảo mật tài khoản
        </h1>
        <p className="text-muted-foreground mt-1">Quản lý mật khẩu và phiên đăng nhập</p>
      </div>

      <ChangePasswordCard />
      <SessionsCard />
    </div>
  );
}
