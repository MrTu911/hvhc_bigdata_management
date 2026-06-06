'use client';

import { Zap, Workflow, Clock, RefreshCw, FileText } from 'lucide-react';
import { EntryShell, type EntryLink } from '@/components/bigdata/entry-shell';
import { DataPanel } from '@/components/ui/enhanced-data-card';
import { PipelineDag } from '@/components/bigdata/pipeline-dag';
import { SAMPLE_DAG } from '@/components/bigdata/mock-data';

const LINKS: EntryLink[] = [
  {
    title: 'Tự động hóa ETL',
    description: 'Quản lý workflow, lịch chạy và thực thi pipeline trích xuất — chuyển đổi — nạp.',
    href: '/dashboard/etl/automation',
    icon: Workflow,
  },
  {
    title: 'Lịch chạy & Scheduler',
    description: 'Cấu hình lịch chạy định kỳ và theo dõi job sắp tới.',
    href: '/dashboard/etl/automation',
    icon: Clock,
  },
  {
    title: 'Nhật ký & Thử lại',
    description: 'Xem log thực thi, lỗi và thử lại các job thất bại.',
    href: '/dashboard/etl/automation',
    icon: RefreshCw,
  },
  {
    title: 'Quản trị hạ tầng dữ liệu',
    description: 'Tổng quan pipeline, lưu trữ, sao lưu và khôi phục thảm họa.',
    href: '/dashboard/infrastructure',
    icon: FileText,
  },
];

export default function PipelinesShellPage() {
  return (
    <EntryShell
      supra="KHAI THÁC DỮ LIỆU · ETL & PIPELINE"
      title="ETL & Pipeline dữ liệu"
      subtitle="Điều phối luồng trích xuất, chuẩn hóa và nạp dữ liệu vào kho"
      heroIcon={Zap}
      links={LINKS}
    >
      <DataPanel title="Sơ đồ pipeline tiêu biểu" subtitle="Nguồn → Trích xuất → Chuẩn hóa → Kiểm tra → Nạp kho">
        <PipelineDag nodes={SAMPLE_DAG} />
      </DataPanel>
    </EntryShell>
  );
}
