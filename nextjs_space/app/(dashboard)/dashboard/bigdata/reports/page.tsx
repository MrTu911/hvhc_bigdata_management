'use client';

import { PieChart, BarChart3, FileBarChart, Gauge } from 'lucide-react';
import { EntryShell, type EntryLink } from '@/components/bigdata/entry-shell';

const LINKS: EntryLink[] = [
  {
    title: 'Phân tích & Biểu đồ',
    description: 'Bộ công cụ phân tích dữ liệu đa chiều với biểu đồ tương tác.',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Phân tích nâng cao',
    description: 'Phân tích chuyên sâu và xuất dữ liệu phục vụ báo cáo.',
    href: '/dashboard/analytics/advanced',
    icon: PieChart,
  },
  {
    title: 'Báo cáo & Thống kê',
    description: 'Tạo, quản lý và xuất báo cáo định kỳ qua nền tảng export (M18).',
    href: '/dashboard/reports',
    icon: FileBarChart,
  },
  {
    title: 'Chỉ số KPI',
    description: 'Bảng chỉ số vận hành theo thời gian thực và định kỳ.',
    href: '/dashboard/kpis',
    icon: Gauge,
  },
];

export default function ReportsShellPage() {
  return (
    <EntryShell
      supra="KHAI THÁC DỮ LIỆU · BÁO CÁO & THỐNG KÊ"
      title="Báo cáo & Thống kê dữ liệu"
      subtitle="Phân tích, KPI và xuất báo cáo từ kho dữ liệu hợp nhất"
      heroIcon={PieChart}
      links={LINKS}
    />
  );
}
