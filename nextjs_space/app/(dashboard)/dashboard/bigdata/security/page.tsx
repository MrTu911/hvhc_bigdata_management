'use client';

import { Shield, ShieldBan, History, ScrollText, Scale } from 'lucide-react';
import { EntryShell, type EntryLink } from '@/components/bigdata/entry-shell';

const LINKS: EntryLink[] = [
  {
    title: 'Kiểm toán an ninh',
    description: 'Phát hiện hoạt động nghi vấn và rà soát sự kiện an ninh.',
    href: '/dashboard/security/audit',
    icon: ShieldBan,
  },
  {
    title: 'Nhật ký đăng nhập',
    description: 'Lịch sử đăng nhập, đăng xuất và quản lý phiên truy cập.',
    href: '/dashboard/security/login-audit',
    icon: History,
  },
  {
    title: 'Chính sách bảo mật',
    description: 'Quản lý chính sách mật khẩu, MFA và phân loại dữ liệu.',
    href: '/dashboard/security/policy',
    icon: ScrollText,
  },
  {
    title: 'Tuân thủ dữ liệu',
    description: 'Theo dõi tuân thủ, dòng dữ liệu và chính sách lưu trữ.',
    href: '/dashboard/governance/compliance',
    icon: Scale,
  },
];

export default function SecurityShellPage() {
  return (
    <EntryShell
      supra="KHAI THÁC DỮ LIỆU · AN NINH"
      title="An ninh & Bảo mật dữ liệu"
      subtitle="Kiểm toán, chính sách và phân loại dữ liệu nhạy cảm"
      heroIcon={Shield}
      links={LINKS}
    />
  );
}
