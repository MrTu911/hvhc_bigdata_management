'use client';

/**
 * /dashboard/settings/security
 * Bảo mật tài khoản: đổi mật khẩu, xem phiên đăng nhập.
 * Yêu cầu: MANAGE_MY_SECURITY (Tầng 0 — MỌI user)
 *
 * Logic được tách thành các component dùng chung trong ../_components để
 * tái sử dụng tại trang /dashboard/settings (tab Bảo mật).
 */

import { Suspense } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ChangePasswordCard } from '../_components/change-password-card';
import { MfaCard } from '../_components/mfa-card';
import { SessionsCard } from '../_components/sessions-card';

function ForceChangeBanner() {
  const forceChange = useSearchParams().get('forceChange') === '1';
  if (!forceChange) return null;
  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">Bạn cần đổi mật khẩu trước khi tiếp tục</p>
        <p>Tài khoản đang dùng mật khẩu cấp sẵn. Hãy đặt mật khẩu mới để bảo vệ thông tin.</p>
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Bảo mật tài khoản
        </h1>
        <p className="text-muted-foreground mt-1">Quản lý mật khẩu, MFA và phiên đăng nhập</p>
      </div>

      <Suspense fallback={null}>
        <ForceChangeBanner />
      </Suspense>
      <ChangePasswordCard />
      <MfaCard />
      <SessionsCard />
    </div>
  );
}
