'use client';

import { Activity, Radio, Bell, ServerCog } from 'lucide-react';
import { EntryShell, type EntryLink } from '@/components/bigdata/entry-shell';

const LINKS: EntryLink[] = [
  {
    title: 'Giám sát hệ thống',
    description: 'Tình trạng dịch vụ, tài nguyên cụm và sức khỏe hạ tầng.',
    href: '/dashboard/monitoring',
    icon: ServerCog,
  },
  {
    title: 'Giám sát thời gian thực',
    description: 'Theo dõi chỉ số CPU/RAM/I/O và lưu lượng theo thời gian thực.',
    href: '/dashboard/monitoring/realtime',
    icon: Radio,
  },
  {
    title: 'Cảnh báo',
    description: 'Quản lý cảnh báo, ngưỡng và xử lý sự cố hệ thống.',
    href: '/dashboard/alerts',
    icon: Bell,
  },
];

export default function MonitorShellPage() {
  return (
    <EntryShell
      supra="KHAI THÁC DỮ LIỆU · GIÁM SÁT"
      title="Giám sát hệ thống dữ liệu"
      subtitle="Theo dõi sức khỏe cụm, dịch vụ và cảnh báo vận hành"
      heroIcon={Activity}
      links={LINKS}
    />
  );
}
