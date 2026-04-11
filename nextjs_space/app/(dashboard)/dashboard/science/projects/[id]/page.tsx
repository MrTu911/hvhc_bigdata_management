'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, FlaskConical, Users, Milestone, BookOpen,
  Shield, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  PlayCircle, Clock, RefreshCw, Send,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT:        'Nháp',
  SUBMITTED:    'Đã nộp',
  UNDER_REVIEW: 'Thẩm định',
  APPROVED:     'Phê duyệt',
  REJECTED:     'Từ chối',
  IN_PROGRESS:  'Đang thực hiện',
  PAUSED:       'Tạm dừng',
  COMPLETED:    'Hoàn thành',
  CANCELLED:    'Hủy',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:        'bg-gray-100 text-gray-600',
  SUBMITTED:    'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED:     'bg-teal-100 text-teal-700',
  REJECTED:     'bg-red-100 text-red-600',
  IN_PROGRESS:  'bg-violet-100 text-violet-700',
  PAUSED:       'bg-orange-100 text-orange-700',
  COMPLETED:    'bg-emerald-100 text-emerald-700',
  CANCELLED:    'bg-red-50 text-red-400',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:       'Đề xuất',
  CONTRACT:       'Ký hợp đồng',
  EXECUTION:      'Thực hiện',
  MIDTERM_REVIEW: 'Giữa kỳ',
  FINAL_REVIEW:   'Nghiệm thu',
  ACCEPTED:       'Đạt',
  ARCHIVED:       'Lưu trữ',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI:   'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT:              'Công nghệ thông tin',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const TYPE_LABELS: Record<string, string> = {
  CO_BAN:                'Cơ bản',
  UNG_DUNG:              'Ứng dụng',
  TRIEN_KHAI:            'Triển khai',
  SANG_KIEN_KINH_NGHIEM: 'Sáng kiến kinh nghiệm',
};

// Định nghĩa action buttons theo trạng thái hiện tại
const WORKFLOW_ACTIONS: Record<string, Array<{
  toStatus: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'destructive';
  requireComment?: boolean;
  confirmMsg?: string;
}>> = {
  DRAFT: [
    { toStatus: 'SUBMITTED', label: 'Nộp đề xuất', icon: <Send className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true, confirmMsg: 'Xác nhận hủy đề tài?' },
  ],
  SUBMITTED: [
    { toStatus: 'UNDER_REVIEW', label: 'Tiếp nhận thẩm định', icon: <Clock className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'REJECTED', label: 'Từ chối', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'outline', requireComment: true, confirmMsg: 'Xác nhận hủy?' },
  ],
  UNDER_REVIEW: [
    { toStatus: 'APPROVED', label: 'Phê duyệt', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'REJECTED', label: 'Từ chối', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
  APPROVED: [
    { toStatus: 'IN_PROGRESS', label: 'Kích hoạt thực hiện', icon: <PlayCircle className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true, confirmMsg: 'Xác nhận hủy đề tài đã duyệt?' },
  ],
  REJECTED: [
    { toStatus: 'DRAFT', label: 'Trả về nháp để chỉnh sửa', icon: <RefreshCw className="h-4 w-4" />, variant: 'outline' },
  ],
  IN_PROGRESS: [
    { toStatus: 'PAUSED', label: 'Tạm dừng', icon: <Clock className="h-4 w-4" />, variant: 'outline', requireComment: true },
    { toStatus: 'COMPLETED', label: 'Hoàn thành', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default', confirmMsg: 'Xác nhận hoàn thành đề tài?' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
  PAUSED: [
    { toStatus: 'IN_PROGRESS', label: 'Tiếp tục thực hiện', icon: <PlayCircle className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDetail {
  id: string;
  projectCode: string;
  title: string;
  titleEn?: string;
  abstract?: string;
  keywords: string[];
  category: string;
  field: string;
  researchType: string;
  status: string;
  phase: string;
  sensitivity: string;
  budgetRequested?: number;
  budgetApproved?: number;
  budgetYear?: number;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  bqpProjectCode?: string;
  completionScore?: number;
  completionGrade?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  principalInvestigator: { id: string; name: string; rank?: string; email?: string };
  unit?: { id: string; name: string; code: string };
  members?: Array<{ id: string; role: string; user: { name: string; rank?: string } }>;
  milestones?: Array<{ id: string; title: string; status: string; dueDate: string; completedAt?: string }>;
  publications?: Array<{ id: string; title: string; pubType: string; publishedYear?: number }>;
  workflowLogs?: Array<{ id: string; fromStatus: string; toStatus: string; actedAt: string; comment?: string; actionBy: { name: string } }>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const vnd = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : '—';

function SensitivityBadge({ sensitivity }: { sensitivity: string }) {
  if (sensitivity === 'NORMAL') return null;
  const cfg = sensitivity === 'SECRET'
    ? { icon: <ShieldAlert className="h-3 w-3" />, label: 'Tuyệt mật', cls: 'bg-red-50 text-red-700 border-red-200' }
    : { icon: <ShieldCheck className="h-3 w-3" />, label: 'Mật', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingAction, setPendingAction] = useState<{ toStatus: string; toPhase?: string } | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/projects/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Không tải được đề tài');
      setProject(data.data);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải đề tài');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleTransition = useCallback(async (toStatus: string, toPhase?: string) => {
    if (transitioning) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/science/projects/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, toPhase, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      toast.success(`Đã chuyển trạng thái → ${STATUS_LABELS[toStatus] ?? toStatus}`);
      setPendingAction(null);
      setComment('');
      await fetchProject();
    } catch (err: any) {
      toast.error(err.message ?? 'Thao tác thất bại');
    } finally {
      setTransitioning(false);
    }
  }, [id, comment, transitioning, fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-gray-500 mb-4">Không tìm thấy đề tài hoặc bạn không có quyền xem.</p>
        <Link href="/dashboard/science/projects">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const actions = WORKFLOW_ACTIONS[project.status] ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/science/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4" /> Danh sách đề tài
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <FlaskConical className="h-6 w-6 text-violet-600 flex-shrink-0" />
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{project.title}</h1>
            <SensitivityBadge sensitivity={project.sensitivity} />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="font-mono text-sm text-violet-600">{project.projectCode}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
            <span className="text-xs text-gray-400">Phase: {PHASE_LABELS[project.phase] ?? project.phase}</span>
          </div>
        </div>
      </div>

      {/* Workflow action panel */}
      {actions.length > 0 && (
        <Card className="border-violet-200 bg-violet-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-violet-800">Thao tác vòng đời</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.toStatus}
                  variant={action.variant}
                  size="sm"
                  disabled={transitioning}
                  onClick={() => {
                    if (action.confirmMsg) {
                      if (!confirm(action.confirmMsg)) return;
                    }
                    if (action.requireComment && !comment.trim()) {
                      setPendingAction({ toStatus: action.toStatus });
                      return;
                    }
                    handleTransition(action.toStatus);
                  }}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Comment input khi cần */}
            {(pendingAction || actions.some(a => a.requireComment)) && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Ghi chú / lý do (bắt buộc khi từ chối hoặc hủy)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="text-sm bg-white"
                />
                {pendingAction && (
                  <Button
                    size="sm"
                    disabled={!comment.trim() || transitioning}
                    onClick={() => handleTransition(pendingAction.toStatus, pendingAction.toPhase)}
                  >
                    Xác nhận: {STATUS_LABELS[pendingAction.toStatus] ?? pendingAction.toStatus}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Thông tin đề tài</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="Cấp đề tài" value={CATEGORY_LABELS[project.category] ?? project.category} />
              <InfoRow label="Lĩnh vực" value={FIELD_LABELS[project.field] ?? project.field} />
              <InfoRow label="Loại NC" value={TYPE_LABELS[project.researchType] ?? project.researchType} />
              <InfoRow label="Năm kinh phí" value={project.budgetYear?.toString()} />
              <InfoRow label="KP đề xuất" value={vnd(project.budgetRequested)} />
              <InfoRow label="KP phê duyệt" value={vnd(project.budgetApproved)} />
              <InfoRow label="Bắt đầu" value={project.startDate ? new Date(project.startDate).toLocaleDateString('vi-VN') : undefined} />
              <InfoRow label="Kết thúc" value={project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : undefined} />
              {project.bqpProjectCode && (
                <InfoRow label="Mã BQP" value={project.bqpProjectCode} />
              )}
              {project.completionGrade && (
                <InfoRow label="Kết quả" value={`${project.completionGrade}${project.completionScore ? ` (${project.completionScore})` : ''}`} />
              )}
            </CardContent>
          </Card>

          {/* Abstract */}
          {project.abstract && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{project.abstract}</p>
                {project.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Milestone className="h-4 w-4" /> Mốc tiến độ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                      <span className="text-gray-800">{m.title}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{new Date(m.dueDate).toLocaleDateString('vi-VN')}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          m.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700'
                            : m.status === 'OVERDUE' ? 'bg-red-100 text-red-600'
                            : m.status === 'IN_PROGRESS' ? 'bg-violet-100 text-violet-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {m.status === 'COMPLETED' ? 'Xong' : m.status === 'OVERDUE' ? 'Trễ' : m.status === 'IN_PROGRESS' ? 'Đang làm' : 'Chờ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publications */}
          {project.publications && project.publications.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Ấn phẩm liên quan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.publications.map((pub) => (
                    <div key={pub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                      <span className="text-gray-800 line-clamp-1">{pub.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{pub.publishedYear}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Members + Workflow log */}
        <div className="space-y-6">

          {/* PI & Members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Nhóm nghiên cứu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2 py-1.5 border-b border-gray-100">
                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium flex-shrink-0">CN</span>
                <div>
                  <div className="font-medium text-gray-900">{project.principalInvestigator.name}</div>
                  {project.principalInvestigator.rank && (
                    <div className="text-xs text-gray-400">{project.principalInvestigator.rank}</div>
                  )}
                </div>
              </div>
              {project.members?.map((m) => (
                <div key={m.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs flex-shrink-0">
                    {m.role === 'THU_KY_KHOA_HOC' ? 'TK' : m.role === 'THANH_VIEN_CHINH' ? 'TV' : 'CTV'}
                  </span>
                  <div>
                    <div className="text-gray-800">{m.user.name}</div>
                    {m.user.rank && <div className="text-xs text-gray-400">{m.user.rank}</div>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workflow log */}
          {project.workflowLogs && project.workflowLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Lịch sử vòng đời</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.workflowLogs.slice().reverse().map((log) => (
                    <div key={log.id} className="relative pl-4 border-l-2 border-gray-200 text-xs text-gray-600">
                      <div className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-violet-400" />
                      <div className="font-medium text-gray-800">
                        {STATUS_LABELS[log.fromStatus] ?? log.fromStatus}
                        {' → '}
                        {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                      </div>
                      <div className="text-gray-400 mt-0.5">
                        {log.actionBy.name} · {new Date(log.actedAt).toLocaleDateString('vi-VN')}
                      </div>
                      {log.comment && (
                        <div className="italic text-gray-500 mt-0.5">"{log.comment}"</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}
