'use client';

/**
 * SecuritySettingsTab — Tab Bảo mật của trang /dashboard/settings.
 * Gộp đổi mật khẩu, MFA và phiên đăng nhập (các component dùng chung).
 */

import { ChangePasswordCard } from './change-password-card';
import { MfaCard } from './mfa-card';
import { SessionsCard } from './sessions-card';

export function SecuritySettingsTab() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <MfaCard />
      <SessionsCard />
    </div>
  );
}
