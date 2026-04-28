'use client';

/**
 * M23 — Báo cáo Sáng kiến với Hội đồng Nghiệm thu Cấp Học viện
 * Actor: Chủ nhiệm sáng kiến — chọn đề tài để soạn/nộp báo cáo
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Users,
  RefreshCw,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện',
  CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC: 'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Nghệ thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần – Kỹ thuật',
  KHOA_HOC_XA_HOI: 'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT: 'Công nghệ thông tin',
  Y_DUOC: 'Y – Dược',
  KHAC: 'Khác',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL: 'Đề xuất',
  CONTRACT: 'Ký hợp đồng',
  EXECUTION: 'Triển khai',
  MIDTERM_REVIEW: 'Kiểm tra giữa kỳ',
  FINAL_REVIEW: 'Nghiệm thu',
  ACCEPTED: 'Được nghiệm thu',
  ARCHIVED: 'Lưu trữ',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWED: 'Đã xem xét',
  APPROVED: 'Đã duyệt',
};

const COUNCIL_RESULT_LABELS: Record<string, string> = {
  PASS: 'Đạt nghiệm thu',
  FAIL: 'Không đạt',
  REVISE: 'Cần sửa đổi',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  researchType: string;
  field: string;
  status: string;
  phase: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
  // Được enrich thêm sau khi gọi acceptance-report API
  reportStatus?: string | null;
  councilResult?: string | null;
  councilMeetingDate?: string | null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AcceptanceReportListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [enriching, setEnriching] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
      // Lấy tất cả sáng kiến (sang_kien_co_so hoặc loại SANG_KIEN_KINH_NGHIEM)
      const res = await fetch(
        `/api/science/projects?category=SANG_KIEN_CO_SO&pageSize=100${kw}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi tải dữ liệu');
      const items: ProjectRow[] = json.data?.items ?? json.data ?? [];
      setProjects(items);
      // Enrich từng đề tài với trạng thái báo cáo và hội đồng
      enrichProjects(items);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải danh sách sáng kiến');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function enrichProjects(items: ProjectRow[]) {
    if (items.length === 0) return;
    setEnriching(true);
    try {
      const enriched = await Promise.all(
        items.map(async (p) => {
          try {
            const res = await fetch(`/api/science/projects/${p.id}/acceptance-report`);
            const json = await res.json();
            if (!json.success) return p;
            const { report, council } = json.data;
            return {
              ...p,
              reportStatus: report?.status ?? null,
              councilResult: council?.result ?? null,
              councilMeetingDate: council?.meetingDate ?? null,
            };
          } catch {
            return p;
          }
        })
      );
      setProjects(enriched);
    } finally {
      setEnriching(false);
    }
  }

  const stats = {
    total: projects.length,
    hasReport: projects.filter((p) => p.reportStatus).length,
    submitted: projects.filter((p) => p.reportStatus === 'SUBMITTED').length,
    councilDone: projects.filter((p) => p.councilResult).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-100">
            <ClipboardList className="h-6 w-6 text-violet-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Báo cáo Sáng kiến với Hội đồng Nghiệm thu
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Soạn và nộp nội dung báo cáo sáng kiến để hội đồng cấp học viện xem xét
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="h-5 w-5 text-violet-600" />}
            bg="bg-violet-50"
            label="Tổng sáng kiến"
            value={stats.total}
          />
          <StatCard
            icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Đã có báo cáo"
            value={stats.hasReport}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-50"
            label="Đã nộp báo cáo"
            value={stats.submitted}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-amber-600" />}
            bg="bg-amber-50"
            label="Đã có kết quả HĐ"
            value={stats.councilDone}
          />
        </div>

        {/* ── Search ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 text-sm"
              placeholder="Tìm mã, tên sáng kiến..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button
            onClick={fetchProjects}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </button>
          {enriching && (
            <span className="text-xs text-gray-400 animate-pulse">Đang tải chi tiết...</span>
          )}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-2 text-sm text-gray-500">Đang tải danh sách...</span>
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center text-center">
              <ClipboardList className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy sáng kiến nào</p>
              <p className="text-sm text-gray-400 mt-1">
                {keyword
                  ? 'Thử thay đổi từ khoá tìm kiếm'
                  : 'Bạn chưa có sáng kiến nào hoặc chưa được phân công'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} router={router} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  project: p,
  router,
}: {
  project: ProjectRow;
  router: ReturnType<typeof useRouter>;
}) {
  const reportBadge = getReportBadge(p.reportStatus);
  const councilBadge = getCouncilBadge(p.councilResult);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
      onClick={() =>
        router.push(
          `/dashboard/science/activities/acceptance-report/${p.id}`
        )
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-gray-400">{p.projectCode}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                {CATEGORY_LABELS[p.category] ?? p.category}
              </span>
              {FIELD_LABELS[p.field] && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {FIELD_LABELS[p.field]}
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.title}</p>
            <p className="text-xs text-gray-500 mt-1">
              Chủ nhiệm: {p.principalInvestigator.rank ? `${p.principalInvestigator.rank} ` : ''}
              {p.principalInvestigator.name}
              {p.unit ? ` · ${p.unit.name}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Giai đoạn: {PHASE_LABELS[p.phase] ?? p.phase}
            </p>
          </div>

          {/* Right badges + arrow */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex flex-col items-end gap-1.5">
              {/* Trạng thái báo cáo */}
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${reportBadge.cls}`}>
                {reportBadge.label}
              </span>
              {/* Kết quả hội đồng */}
              {p.councilResult ? (
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${councilBadge.cls}`}>
                  {councilBadge.label}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-400">
                  Chưa có HĐ
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getReportBadge(status?: string | null) {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Đã nộp báo cáo', cls: 'bg-emerald-100 text-emerald-700' };
    case 'REVIEWED':
      return { label: 'Đang xem xét', cls: 'bg-blue-100 text-blue-700' };
    case 'APPROVED':
      return { label: 'Báo cáo đã duyệt', cls: 'bg-teal-100 text-teal-700' };
    case 'DRAFT':
      return { label: 'Bản nháp', cls: 'bg-amber-100 text-amber-700' };
    default:
      return { label: 'Chưa có báo cáo', cls: 'bg-gray-100 text-gray-500' };
  }
}

function getCouncilBadge(result?: string | null) {
  switch (result) {
    case 'PASS':
      return { label: 'Đạt nghiệm thu', cls: 'bg-emerald-100 text-emerald-700' };
    case 'FAIL':
      return { label: 'Không đạt', cls: 'bg-red-100 text-red-700' };
    case 'REVISE':
      return { label: 'Cần sửa đổi', cls: 'bg-amber-100 text-amber-700' };
    default:
      return { label: '', cls: '' };
  }
}
