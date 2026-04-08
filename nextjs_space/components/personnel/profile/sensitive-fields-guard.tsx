'use client';

import { Lock } from 'lucide-react';

interface SensitiveFieldsGuardProps {
  canView: boolean;
  children: React.ReactNode;
  label?: string;
}

/**
 * Bảo vệ trường nhạy cảm: chỉ hiển thị nội dung khi canView = true.
 * Nếu không có quyền, hiển thị placeholder thay vì lỗi.
 * Dùng function VIEW_PERSONNEL_SENSITIVE từ M01 RBAC.
 */
export function SensitiveFieldsGuard({
  canView,
  children,
  label = 'Bạn không có quyền xem thông tin nhạy cảm',
}: SensitiveFieldsGuardProps) {
  if (canView) return <>{children}</>;

  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
      <Lock className="w-3 h-3" />
      <span className="italic">{label}</span>
    </span>
  );
}

/**
 * Block-level guard: hiển thị thẻ khóa thay vì toàn bộ section.
 */
export function SensitiveSectionGuard({
  canView,
  children,
}: {
  canView: boolean;
  children: React.ReactNode;
}) {
  if (canView) return <>{children}</>;

  return (
    <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/40 text-muted-foreground text-sm border border-dashed">
      <Lock className="w-4 h-4 shrink-0" />
      <span>Thông tin bị ẩn — yêu cầu quyền <strong>VIEW_PERSONNEL_SENSITIVE</strong></span>
    </div>
  );
}
