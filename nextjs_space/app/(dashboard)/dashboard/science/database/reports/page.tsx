'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileSpreadsheet, FileText, Download, Loader2, CheckCircle2,
  Clock, AlertCircle, BarChart2,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const REPORT_TYPES = [
  {
    value:       'MONTHLY',
    label:       'Báo cáo tháng NCKH',
    template:    'BQP-NCKH-MONTHLY',
    description: 'Tổng hợp hoạt động NCKH theo tháng của đơn vị.',
    icon:        FileText,
    color:       'bg-violet-50 border-violet-200',
    badge:       'bg-violet-100 text-violet-700',
  },
  {
    value:       'QUARTERLY',
    label:       'Báo cáo đề tài theo cấp',
    template:    'BQP-NCKH-PROJECT-LEVEL',
    description: 'Danh sách đề tài NCKH phân theo cấp quản lý.',
    icon:        BarChart2,
    color:       'bg-blue-50 border-blue-200',
    badge:       'bg-blue-100 text-blue-700',
  },
  {
    value:       'ANNUAL',
    label:       'Danh sách công trình KH năm',
    template:    'BQP-NCKH-WORKS-ANNUAL',
    description: 'Tổng hợp sách, giáo trình, chuyên đề được xuất bản trong năm.',
    icon:        FileText,
    color:       'bg-teal-50 border-teal-200',
    badge:       'bg-teal-100 text-teal-700',
  },
  {
    value:       'BUDGET',
    label:       'Tổng hợp kinh phí NCKH',
    template:    'BQP-NCKH-BUDGET-SUMMARY',
    description: 'Dự toán, phân bổ và quyết toán kinh phí nghiên cứu khoa học.',
    icon:        FileSpreadsheet,
    color:       'bg-emerald-50 border-emerald-200',
    badge:       'bg-emerald-100 text-emerald-700',
  },
  {
    value:       'SCIENTIST',
    label:       'Hồ sơ nhà khoa học (BQP)',
    template:    'BQP-NCKH-SCIENTIST',
    description: 'Báo cáo tiềm lực khoa học và hồ sơ nhà khoa học theo mẫu BQP.',
    icon:        FileText,
    color:       'bg-amber-50 border-amber-200',
    badge:       'bg-amber-100 text-amber-700',
  },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportJob {
  jobId:        string;
  templateCode: string;
  templateName: string;
  reportType:   string;
  year:         number;
  unit:         string | null;
  format:       string;
  status:       'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  requestedAt:  string;
  error?:       string;
}

// ─── Job Status Card ──────────────────────────────────────────────────────────

function JobCard({ job }: { job: ReportJob }) {
  const typeConf = REPORT_TYPES.find((t) => t.value === job.reportType);
  const Icon = typeConf?.icon ?? FileText;

  const statusEl = job.status === 'DONE' ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <CheckCircle2 size={11} /> Hoàn thành
    </span>
  ) : job.status === 'FAILED' ? (
    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <AlertCircle size={11} /> Thất bại
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      <Clock size={11} /> Đang xử lý
    </span>
  );

  return (
    <div className="flex items-start gap-3 border border-gray-100 rounded-lg p-3 bg-white shadow-sm">
      <div className="p-2 rounded-lg bg-gray-50 flex-shrink-0">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{typeConf?.label ?? job.reportType}</span>
          {statusEl}
          <span className="text-xs font-mono text-gray-400">{job.format}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Năm {job.year} · {job.unit ? `Đơn vị ${job.unit}` : 'Toàn học viện'} ·
          {' '}{new Date(job.requestedAt).toLocaleTimeString('vi-VN')}
        </div>
        <div className="text-xs text-gray-400 font-mono mt-0.5">ID: {job.jobId.slice(0, 8)}...</div>
        {job.error && <div className="text-xs text-red-600 mt-1">{job.error}</div>}
        {job.status === 'PENDING' && (
          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full animate-pulse w-2/5" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('ANNUAL');
  const [year,         setYear]         = useState(CURRENT_YEAR);
  const [format,       setFormat]       = useState<'DOCX' | 'XLSX'>('DOCX');
  const [generating,   setGenerating]   = useState(false);
  const [jobs,         setJobs]         = useState<ReportJob[]>([]);

  const selectedConf = REPORT_TYPES.find((t) => t.value === selectedType)!;

  const generate = async () => {
    setGenerating(true);
    try {
      const params = new URLSearchParams({
        type:   selectedType,
        year:   String(year),
        format,
      });
      const res  = await fetch(`/api/science/reports?${params}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          typeof json.error === 'string'
            ? json.error
            : json.error?.message ?? 'Tạo báo cáo thất bại'
        );
      }

      const newJob: ReportJob = {
        ...json.data,
        requestedAt: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      toast.success('Đã xếp hàng tạo báo cáo — M18 đang xử lý');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Download size={24} className="text-violet-600" />
          Xuất báo cáo Khoa học
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Báo cáo theo mẫu BQP — xử lý qua M18 export engine
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Left — report type selection */}
        <div className="sm:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Chọn loại báo cáo</h2>
          {REPORT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`w-full text-left border rounded-xl p-4 transition-all ${
                selectedType === t.value
                  ? `${t.color} ring-2 ring-offset-1 ring-violet-400`
                  : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${t.badge}`}>
                  <t.icon size={16} />
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1">{t.template}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right — config + generate */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cấu hình xuất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Năm báo cáo</label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Định dạng</label>
                <Select value={format} onValueChange={(v) => setFormat(v as 'DOCX' | 'XLSX')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCX">Word (.docx)</SelectItem>
                    <SelectItem value="XLSX">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-1 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <div><span className="font-medium">Loại:</span> {selectedConf.label}</div>
                <div><span className="font-medium">Mẫu:</span> {selectedConf.template}</div>
                <div><span className="font-medium">Phạm vi:</span> Toàn học viện</div>
              </div>

              <Button
                className="w-full"
                onClick={generate}
                disabled={generating}
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin mr-1" /> Đang xếp hàng...</>
                  : <><Download size={14} className="mr-1" /> Tạo báo cáo</>}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Báo cáo xử lý bất đồng bộ qua M18.
                File sẽ sẵn sàng tải trong vài phút.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job history */}
      {jobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Lịch sử tạo báo cáo ({jobs.length})
          </h2>
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
