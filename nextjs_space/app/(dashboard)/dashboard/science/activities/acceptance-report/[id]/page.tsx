'use client';

/**
 * M23 — Báo cáo Sáng kiến: Trang chi tiết tương tác
 * Actor: Chủ nhiệm sáng kiến soạn thảo và nộp báo cáo
 *
 * Tab 1: Nội dung báo cáo  — form soạn thảo, lưu nháp, nộp
 * Tab 2: Hội đồng nghiệm thu — xem thành viên, lịch họp
 * Tab 3: Kết quả & Nhận xét — điểm từng tiêu chí, kết luận HĐ
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  FileText,
  Users,
  Award,
  Save,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  Star,
  ClipboardList,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần – Kỹ thuật',
  KHOA_HOC_XA_HOI:   'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT:              'Công nghệ thông tin',
  Y_DUOC:            'Y – Dược',
  KHAC:              'Khác',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:       'Đề xuất',
  CONTRACT:       'Ký hợp đồng',
  EXECUTION:      'Triển khai',
  MIDTERM_REVIEW: 'Kiểm tra giữa kỳ',
  FINAL_REVIEW:   'Nghiệm thu',
  ACCEPTED:       'Được nghiệm thu',
  ARCHIVED:       'Lưu trữ',
};

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHAIRMAN:  'Chủ tịch Hội đồng',
  SECRETARY: 'Thư ký khoa học',
  REVIEWER:  'Uỷ viên phản biện',
  EXPERT:    'Chuyên gia tư vấn',
};

const CRITERIA_LABELS: Record<string, string> = {
  SCIENTIFIC_VALUE: 'Giá trị khoa học & thực tiễn',
  FEASIBILITY:      'Tính khả thi & ứng dụng',
  BUDGET:           'Hiệu quả kinh tế (nếu có)',
  TEAM:             'Năng lực nhóm tác giả',
  OUTCOME:          'Sản phẩm / kết quả đầu ra',
};

const COUNCIL_RESULT_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PASS:   {
    label: 'ĐẠT NGHIỆM THU',
    cls: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  },
  FAIL:   {
    label: 'KHÔNG ĐẠT',
    cls: 'bg-red-50 border-red-300 text-red-800',
    icon: <AlertCircle className="h-5 w-5 text-red-600" />,
  },
  REVISE: {
    label: 'YÊU CẦU SỬA ĐỔI BỔ SUNG',
    cls: 'bg-amber-50 border-amber-300 text-amber-800',
    icon: <Clock className="h-5 w-5 text-amber-600" />,
  },
};

const ACCEPTANCE_RESULT_LABELS: Record<string, string> = {
  PASS:        'Đạt',
  FAIL:        'Không đạt',
  CONDITIONAL: 'Đạt có điều kiện',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  researchType: string;
  field: string;
  status: string;
  phase: string;
  startDate?: string;
  endDate?: string;
  budgetRequested?: number;
  principalInvestigator: { id: string; name: string; rank?: string; academicTitle?: string };
  unit?: { id: string; name: string; code: string };
  members: Array<{ id: string; role: string; user: { id: string; name: string; rank?: string } }>;
}

interface Report {
  id: string;
  reportPeriod: string;
  reportType: string;
  content: string; // JSON string
  status: string;
  completionPercent: number;
  issues?: string;
  nextSteps?: string;
  attachmentUrl?: string;
  submittedAt?: string;
  updatedAt: string;
  submittedBy?: { id: string; name: string };
}

interface Council {
  id: string;
  type: string;
  meetingDate?: string;
  result?: string;
  overallScore?: number;
  conclusionText?: string;
  chairman: { id: string; name: string; rank?: string };
  secretary: { id: string; name: string; rank?: string };
  members: Array<{ id: string; role: string; user: { id: string; name: string; rank?: string } }>;
  reviews: Array<{ id: string; criteria: string; score: number; comment?: string }>;
  meetings: Array<{ id: string; meetingDate: string; location?: string; agenda?: string; minutesContent?: string }>;
}

interface Acceptance {
  id: string;
  acceptanceDate: string;
  acceptanceType: string;
  finalScore?: number;
  grade?: string;
  result: string;
  conditions?: string;
  signedMinutesUrl?: string;
  acceptedBy: { id: string; name: string };
  scores: Array<{ id: string; criteria: string; score: number; comment?: string }>;
}

interface ReportFormData {
  reportTitle: string;
  summary: string;
  innovation: string;
  applicability: string;
  results: string;
  issues: string;
  nextSteps: string;
  attachmentUrl: string;
}

type TabKey = 'report' | 'council' | 'result';

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AcceptanceReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [council, setCouncil] = useState<Council | null>(null);
  const [acceptance, setAcceptance] = useState<Acceptance | null>(null);
  const [criteriaAverages, setCriteriaAverages] = useState<Record<string, number> | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('report');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState<ReportFormData>({
    reportTitle: '',
    summary: '',
    innovation: '',
    applicability: '',
    results: '',
    issues: '',
    nextSteps: '',
    attachmentUrl: '',
  });

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/projects/${projectId}/acceptance-report`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi tải dữ liệu');
      const { project: p, report: r, council: c, acceptance: a, criteriaAverages: ca } = json.data;
      setProject(p);
      setCouncil(c);
      setAcceptance(a);
      setCriteriaAverages(ca);
      setReport(r);
      if (r?.content) {
        try {
          const parsed = JSON.parse(r.content);
          setForm({
            reportTitle: parsed.reportTitle ?? p.title,
            summary: parsed.summary ?? '',
            innovation: parsed.innovation ?? '',
            applicability: parsed.applicability ?? '',
            results: parsed.results ?? '',
            issues: r.issues ?? '',
            nextSteps: r.nextSteps ?? '',
            attachmentUrl: r.attachmentUrl ?? '',
          });
        } catch {
          // content không phải JSON — giữ nguyên
          setForm((f) => ({ ...f, reportTitle: p.title }));
        }
      } else {
        setForm((f) => ({ ...f, reportTitle: p?.title ?? '' }));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Auto-save nháp khi form thay đổi ───────────────────────────────────────

  useEffect(() => {
    if (!dirty) return;
    if (report?.status === 'SUBMITTED') return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveReport('save_draft', true);
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form helpers ────────────────────────────────────────────────────────────

  function updateForm(field: keyof ReportFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  async function saveReport(action: 'save_draft' | 'submit', silent = false) {
    if (action === 'save_draft') setSaving(true);
    else setSubmitting(true);

    try {
      const res = await fetch(`/api/science/projects/${projectId}/acceptance-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, action }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi lưu báo cáo');
      setReport(json.data);
      setDirty(false);
      if (!silent) {
        toast.success(action === 'submit' ? 'Đã nộp báo cáo thành công!' : 'Đã lưu bản nháp');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu báo cáo');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  const isSubmitted = report?.status === 'SUBMITTED' || report?.status === 'REVIEWED' || report?.status === 'APPROVED';
  const isReadonly = isSubmitted;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-gray-600">Không tìm thấy đề tài hoặc bạn không có quyền truy cập.</p>
        <Link href="/dashboard/science/activities/acceptance-report">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'report',  label: 'Nội dung báo cáo',       icon: <FileText className="h-4 w-4" /> },
    { key: 'council', label: 'Hội đồng nghiệm thu',     icon: <Users className="h-4 w-4" /> },
    { key: 'result',  label: 'Kết quả & Nhận xét',      icon: <Award className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/science/activities/acceptance-report">
            <button className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-gray-400">{project.projectCode}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                {CATEGORY_LABELS[project.category] ?? project.category}
              </span>
              {FIELD_LABELS[project.field] && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {FIELD_LABELS[project.field]}
                </span>
              )}
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                {PHASE_LABELS[project.phase] ?? project.phase}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Chủ nhiệm: {project.principalInvestigator.rank ? `${project.principalInvestigator.rank} ` : ''}
              {project.principalInvestigator.name}
              {project.unit ? ` · ${project.unit.name}` : ''}
            </p>
          </div>
          {/* Trạng thái báo cáo */}
          <div className="shrink-0">
            {report ? (
              <ReportStatusBadge status={report.status} updatedAt={report.updatedAt} />
            ) : (
              <span className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-gray-500">
                Chưa có báo cáo
              </span>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mt-4 border-t border-gray-100 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                activeTab === t.key
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-6 py-6">
        {activeTab === 'report' && (
          <ReportTab
            form={form}
            onUpdate={updateForm}
            isReadonly={isReadonly}
            saving={saving}
            submitting={submitting}
            dirty={dirty}
            report={report}
            project={project}
            onSaveDraft={() => saveReport('save_draft')}
            onSubmit={() => saveReport('submit')}
          />
        )}
        {activeTab === 'council' && (
          <CouncilTab council={council} />
        )}
        {activeTab === 'result' && (
          <ResultTab
            council={council}
            acceptance={acceptance}
            criteriaAverages={criteriaAverages}
          />
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Nội dung báo cáo ───────────────────────────────────────────────────

function ReportTab({
  form,
  onUpdate,
  isReadonly,
  saving,
  submitting,
  dirty,
  report,
  project,
  onSaveDraft,
  onSubmit,
}: {
  form: ReportFormData;
  onUpdate: (field: keyof ReportFormData, value: string) => void;
  isReadonly: boolean;
  saving: boolean;
  submitting: boolean;
  dirty: boolean;
  report: Report | null;
  project: Project;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  const sections: Array<{
    field: keyof ReportFormData;
    label: string;
    hint: string;
    required: boolean;
    rows: number;
    minLen?: number;
    maxLen?: number;
  }> = [
    {
      field: 'summary',
      label: '2. Tóm tắt nội dung sáng kiến',
      hint: 'Mô tả ngắn gọn nội dung và phạm vi áp dụng của sáng kiến',
      required: true,
      rows: 5,
      minLen: 100,
      maxLen: 1500,
    },
    {
      field: 'innovation',
      label: '3. Tính mới, tính sáng tạo',
      hint: 'Điểm mới so với cách làm trước đây, tính sáng tạo của giải pháp',
      required: true,
      rows: 4,
      minLen: 80,
      maxLen: 800,
    },
    {
      field: 'applicability',
      label: '4. Khả năng áp dụng và hiệu quả',
      hint: 'Mức độ áp dụng thực tiễn, hiệu quả kinh tế – kỹ thuật – xã hội đã đạt được',
      required: true,
      rows: 4,
      minLen: 80,
      maxLen: 800,
    },
    {
      field: 'results',
      label: '5. Kết quả, sản phẩm đã đạt được',
      hint: 'Liệt kê các sản phẩm, kết quả cụ thể, số liệu minh chứng',
      required: true,
      rows: 4,
      minLen: 50,
      maxLen: 600,
    },
    {
      field: 'issues',
      label: '6. Khó khăn, vướng mắc (nếu có)',
      hint: 'Các trở ngại gặp phải trong quá trình thực hiện',
      required: false,
      rows: 3,
    },
    {
      field: 'nextSteps',
      label: '7. Đề xuất, kiến nghị',
      hint: 'Đề xuất mở rộng áp dụng, cải tiến thêm hoặc các kiến nghị khác',
      required: false,
      rows: 3,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <Card className="border-violet-200 bg-violet-50/40">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-violet-900 text-sm">
                PHIẾU BÁO CÁO SÁNG KIẾN — HỘI ĐỒNG NGHIỆM THU CẤP HỌC VIỆN
              </p>
              <p className="text-xs text-violet-600 mt-0.5">
                {project.projectCode} · {project.principalInvestigator.rank ?? ''}{' '}
                {project.principalInvestigator.name}
                {project.unit ? ` · ${project.unit.name}` : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isReadonly && (
        <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <div>
            <strong>Báo cáo đã được nộp.</strong> Nội dung hiển thị ở chế độ chỉ đọc.
            Nếu cần chỉnh sửa, vui lòng liên hệ Phòng NCKH để mở lại.
          </div>
        </div>
      )}

      {/* Mục 1: Tên sáng kiến */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-800">
          1. Tên sáng kiến <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.reportTitle}
          onChange={(e) => onUpdate('reportTitle', e.target.value)}
          disabled={isReadonly}
          placeholder="Nhập tên đầy đủ của sáng kiến..."
          className="text-sm"
        />
      </div>

      {/* Các mục còn lại */}
      {sections.map((s) => (
        <div key={s.field} className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-800">
            {s.label}
            {s.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <p className="text-xs text-gray-400">{s.hint}</p>
          <Textarea
            value={form[s.field]}
            onChange={(e) => onUpdate(s.field, e.target.value)}
            disabled={isReadonly}
            rows={s.rows}
            placeholder={s.required ? 'Nhập nội dung...' : 'Không bắt buộc...'}
            className="text-sm resize-y"
          />
          {s.maxLen && (
            <p className="text-xs text-gray-400 text-right">
              {form[s.field].length} / {s.maxLen} ký tự
              {s.minLen && form[s.field].length > 0 && form[s.field].length < s.minLen && (
                <span className="text-amber-500 ml-2">
                  (tối thiểu {s.minLen} ký tự)
                </span>
              )}
            </p>
          )}
        </div>
      ))}

      {/* Tài liệu đính kèm */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-800">8. Tài liệu đính kèm</label>
        <p className="text-xs text-gray-400">URL tài liệu, minh chứng (nếu có)</p>
        <Input
          value={form.attachmentUrl}
          onChange={(e) => onUpdate('attachmentUrl', e.target.value)}
          disabled={isReadonly}
          placeholder="https://..."
          type="url"
          className="text-sm"
        />
      </div>

      {/* Actions */}
      {!isReadonly && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 sticky bottom-0 bg-gray-50 py-4 -mx-6 px-6">
          <div className="text-xs text-gray-400">
            {saving && <span className="animate-pulse">Đang lưu nháp...</span>}
            {!saving && dirty && <span className="text-amber-500">Có thay đổi chưa lưu</span>}
            {!saving && !dirty && report && (
              <span>
                Lưu lúc{' '}
                {new Date(report.updatedAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                {new Date(report.updatedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={saving || submitting || !dirty}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onSubmit}
              disabled={saving || submitting}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {submitting ? 'Đang nộp...' : 'Nộp báo cáo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Hội đồng nghiệm thu ───────────────────────────────────────────────

function CouncilTab({ council }: { council: Council | null }) {
  if (!council) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <Users className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-600">Chưa có hội đồng nghiệm thu</p>
          <p className="text-sm text-gray-400 max-w-sm">
            Hội đồng nghiệm thu cấp học viện chưa được thành lập cho sáng kiến này.
            Vui lòng liên hệ Phòng Nghiên cứu Khoa học để biết thêm thông tin.
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestMeeting = council.meetings[0] ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Thông tin hội đồng */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-600" />
            Thông tin Hội đồng Nghiệm thu
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {latestMeeting?.meetingDate && (
              <InfoRow
                label="Ngày họp"
                value={new Date(latestMeeting.meetingDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                icon={<Calendar className="h-3.5 w-3.5 text-gray-400" />}
              />
            )}
            {latestMeeting?.location && (
              <InfoRow
                label="Địa điểm"
                value={latestMeeting.location}
                icon={<MapPin className="h-3.5 w-3.5 text-gray-400" />}
              />
            )}
          </div>

          {latestMeeting?.agenda && (
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Chương trình họp</p>
              <p className="text-gray-800 whitespace-pre-line bg-gray-50 rounded-lg p-3 text-xs leading-relaxed">
                {latestMeeting.agenda}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách thành viên */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Danh sách Thành viên Hội đồng</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs text-gray-500 font-medium">STT</th>
                  <th className="text-left py-2 pr-4 text-xs text-gray-500 font-medium">Họ và tên</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">Vai trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* Chủ tịch và thư ký */}
                <CouncilMemberRow
                  index={1}
                  name={council.chairman.name}
                  rank={council.chairman.rank}
                  role="CHAIRMAN"
                />
                <CouncilMemberRow
                  index={2}
                  name={council.secretary.name}
                  rank={council.secretary.rank}
                  role="SECRETARY"
                />
                {/* Các thành viên khác */}
                {council.members
                  .filter(
                    (m) =>
                      m.user.id !== council.chairman.id &&
                      m.user.id !== council.secretary.id
                  )
                  .map((m, idx) => (
                    <CouncilMemberRow
                      key={m.id}
                      index={idx + 3}
                      name={m.user.name}
                      rank={m.user.rank}
                      role={m.role}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Biên bản nếu có */}
      {latestMeeting?.minutesContent && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Biên bản phiên họp</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-4 leading-relaxed">
              {latestMeeting.minutesContent}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CouncilMemberRow({
  index,
  name,
  rank,
  role,
}: {
  index: number;
  name: string;
  rank?: string;
  role: string;
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-2.5 pr-4 text-gray-400 text-xs">{index}</td>
      <td className="py-2.5 pr-4 text-gray-900">
        {rank ? <span className="text-gray-500">{rank} </span> : null}
        {name}
      </td>
      <td className="py-2.5">
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            role === 'CHAIRMAN'
              ? 'bg-violet-100 text-violet-700'
              : role === 'SECRETARY'
              ? 'bg-blue-100 text-blue-700'
              : role === 'REVIEWER'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {MEMBER_ROLE_LABELS[role] ?? role}
        </span>
      </td>
    </tr>
  );
}

// ─── Tab 3: Kết quả & Nhận xét ────────────────────────────────────────────────

function ResultTab({
  council,
  acceptance,
  criteriaAverages,
}: {
  council: Council | null;
  acceptance: Acceptance | null;
  criteriaAverages: Record<string, number> | null;
}) {
  const hasCouncilResult = council?.result;

  if (!hasCouncilResult) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
          <Star className="h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-600">Hội đồng chưa kết luận</p>
          <p className="text-sm text-gray-400 max-w-sm">
            {council
              ? 'Hội đồng đang trong quá trình đánh giá. Kết quả sẽ được cập nhật sau phiên họp nghiệm thu.'
              : 'Chưa có hội đồng nghiệm thu được thành lập.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const resultMeta = COUNCIL_RESULT_META[council.result ?? ''];

  // Tính overall từ criteriaAverages
  const avgValues = criteriaAverages ? Object.values(criteriaAverages) : [];
  const overallAvg =
    avgValues.length > 0
      ? Math.round((avgValues.reduce((s, v) => s + v, 0) / avgValues.length) * 10) / 10
      : council.overallScore ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Kết quả tổng */}
      {resultMeta && (
        <div
          className={`flex items-center gap-3 p-5 rounded-xl border-2 font-semibold ${resultMeta.cls}`}
        >
          {resultMeta.icon}
          <div>
            <p className="text-base">KẾT QUẢ NGHIỆM THU: {resultMeta.label}</p>
            {overallAvg !== null && (
              <p className="text-sm font-normal mt-0.5">
                Điểm trung bình: <strong>{overallAvg}</strong> / 10
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bảng điểm tiêu chí */}
      {criteriaAverages && Object.keys(criteriaAverages).length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Bảng điểm theo tiêu chí</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-xs text-gray-500 font-medium">Tiêu chí đánh giá</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-medium">Điểm TB (0–10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(criteriaAverages).map(([criteria, avg]) => (
                    <tr key={criteria} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-4 text-gray-800">
                        {CRITERIA_LABELS[criteria] ?? criteria}
                      </td>
                      <td className="py-3 text-right">
                        <ScoreBar score={avg} />
                      </td>
                    </tr>
                  ))}
                  {/* Dòng tổng */}
                  {overallAvg !== null && (
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td className="py-3 pr-4 font-semibold text-gray-900">Điểm trung bình toàn Hội đồng</td>
                      <td className="py-3 text-right font-bold text-violet-700">{overallAvg} / 10</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kết luận hội đồng */}
      {council.conclusionText && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Kết luận của Hội đồng</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-4 leading-relaxed border border-gray-100">
              {council.conclusionText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quyết định nghiệm thu chính thức */}
      {acceptance && (
        <Card className="border-emerald-200">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              Quyết định Nghiệm thu Chính thức
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow
                label="Ngày nghiệm thu"
                value={new Date(acceptance.acceptanceDate).toLocaleDateString('vi-VN')}
              />
              <InfoRow
                label="Kết quả"
                value={ACCEPTANCE_RESULT_LABELS[acceptance.result] ?? acceptance.result}
              />
              {acceptance.finalScore != null && (
                <InfoRow label="Điểm cuối" value={`${acceptance.finalScore} / 10`} />
              )}
              {acceptance.grade && (
                <InfoRow label="Xếp loại" value={acceptance.grade} />
              )}
            </div>
            {acceptance.conditions && (
              <div className="text-sm">
                <p className="text-gray-500 mb-1">Điều kiện nghiệm thu</p>
                <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                  {acceptance.conditions}
                </p>
              </div>
            )}
            {acceptance.acceptedBy && (
              <p className="text-xs text-gray-400">
                Ký nghiệm thu: {acceptance.acceptedBy.name}
              </p>
            )}
            {acceptance.signedMinutesUrl && (
              <a
                href={acceptance.signedMinutesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Xem biên bản nghiệm thu có chữ ký
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ReportStatusBadge({ status, updatedAt }: { status: string; updatedAt: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    DRAFT:     { label: 'Bản nháp',     cls: 'bg-amber-100 text-amber-700' },
    SUBMITTED: { label: 'Đã nộp',       cls: 'bg-emerald-100 text-emerald-700' },
    REVIEWED:  { label: 'Đang xem xét', cls: 'bg-blue-100 text-blue-700' },
    APPROVED:  { label: 'Đã duyệt',     cls: 'bg-teal-100 text-teal-700' },
  };
  const m = meta[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${m.cls}`}>{m.label}</span>
      <span className="text-xs text-gray-400">
        {new Date(updatedAt).toLocaleDateString('vi-VN')}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color =
    score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-semibold text-gray-800 w-8 text-right">{score}</span>
    </div>
  );
}
