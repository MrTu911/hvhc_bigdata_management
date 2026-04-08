'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Calendar,
  DollarSign,
  FlaskConical,
  Send,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ClipboardList,
  FileCheck,
  ScanSearch,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang thẩm định',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PAUSED: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL: 'Đề xuất',
  CONTRACT: 'Ký hợp đồng',
  EXECUTION: 'Thực hiện',
  MIDTERM_REVIEW: 'Kiểm tra giữa kỳ',
  FINAL_REVIEW: 'Nghiệm thu',
  ACCEPTED: 'Nghiệm thu đạt',
  ARCHIVED: 'Lưu trữ',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện',
  CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC: 'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI: 'KHXH & NV',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT: 'CNTT',
  Y_DUOC: 'Y dược',
  KHAC: 'Khác',
};

const TYPE_LABELS: Record<string, string> = {
  CO_BAN: 'Cơ bản',
  UNG_DUNG: 'Ứng dụng',
  TRIEN_KHAI: 'Triển khai',
  SANG_KIEN_KINH_NGHIEM: 'Sáng kiến kinh nghiệm',
};

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm',
  THU_KY_KHOA_HOC: 'Thư ký KH',
  THANH_VIEN_CHINH: 'Thành viên chính',
  CONG_TAC_VIEN: 'Cộng tác viên',
};

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thực hiện',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Hủy',
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const REVIEW_TYPE_LABELS: Record<string, string> = {
  THAM_DINH_DE_CUONG: 'Thẩm định đề cương',
  KIEM_TRA_GIUA_KY: 'Kiểm tra giữa kỳ',
  NGHIEM_THU_CO_SO: 'Nghiệm thu cơ sở',
  NGHIEM_THU_CAP_HV: 'Nghiệm thu cấp HV',
  NGHIEM_THU_CAP_TREN: 'Nghiệm thu cấp trên',
};

const REVIEW_DECISION_LABELS: Record<string, string> = {
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  REVISION_REQUIRED: 'Cần chỉnh sửa',
};

const REVIEW_DECISION_COLORS: Record<string, string> = {
  PASSED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  REVISION_REQUIRED: 'bg-yellow-100 text-yellow-700',
};

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
};

const vnd = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' triệu đồng' : '—';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

interface Project {
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
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  budgetRequested?: number;
  budgetApproved?: number;
  budgetUsed?: number;
  budgetYear?: number;
  bqpProjectCode?: string;
  approvedAt?: string;
  approverNote?: string;
  rejectedAt?: string;
  rejectReason?: string;
  completionScore?: number;
  completionGrade?: string;
  principalInvestigator: {
    id: string; name: string; rank?: string; militaryId?: string; email?: string; department?: string;
  };
  unit?: { id: string; name: string; code: string };
  members: Array<{
    id: string; role: string; joinDate: string; leaveDate?: string; contribution?: number;
    user: { id: string; name: string; rank?: string; militaryId?: string; department?: string };
  }>;
  milestones: Array<{
    id: string; title: string; dueDate: string; completedAt?: string; status: string; note?: string;
  }>;
  reviews: Array<{
    id: string; reviewType: string; reviewDate: string; score?: number; grade?: string;
    comments?: string; decision: string;
  }>;
  publications: Array<{
    id: string; title: string; pubType: string; publishedYear?: number; journal?: string;
    isISI: boolean; isScopus: boolean; status: string;
    author: { id: string; name: string; rank?: string };
  }>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-[160px] flex-shrink-0">{label}:</span>
      <span className="text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}

export default function NckhProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Project['milestones']>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Milestone form
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', dueDate: '', note: '' });
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Review form
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewType: '',
    reviewDate: '',
    decision: '',
    score: '',
    grade: '',
    comments: '',
  });
  const [savingReview, setSavingReview] = useState(false);

  // Duplicate check
  const [dupOpen, setDupOpen] = useState(false);
  const [dupChecking, setDupChecking] = useState(false);
  const [dupMatches, setDupMatches] = useState<Array<{
    id: string; projectCode: string; title: string; similarity: number;
    status: string; field: string; budgetYear: number | null;
    principalInvestigatorName: string | null; reasons: string[];
  }>>([]);
  const [dupRisk, setDupRisk] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | null>(null);

  const handleDupCheck = async () => {
    if (!project) return;
    setDupOpen(true);
    setDupChecking(true);
    setDupMatches([]);
    setDupRisk(null);
    try {
      const res = await fetch('/api/research/ai/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          keywords: project.keywords ?? [],
          excludeId: project.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDupMatches(data.data.duplicates ?? []);
        setDupRisk(data.data.risk ?? 'NONE');
      }
    } catch {
      toast.error('Không thể kiểm tra trùng lặp');
    } finally {
      setDupChecking(false);
    }
  };

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/research/projects/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Không tìm thấy đề tài');
          router.push('/dashboard/research/projects');
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setProject(data.data ?? data);
    } catch {
      toast.error('Không thể tải thông tin đề tài');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // Fetch milestones qua dedicated endpoint để trigger OVERDUE sync
  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(`/api/research/projects/${id}/milestones`);
      if (!res.ok) return;
      const data = await res.json();
      setMilestones(data.data ?? []);
    } catch {
      // silent – milestones từ project detail dùng làm fallback
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchMilestones();
  }, [fetchProject, fetchMilestones]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/research/projects/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', approverNote: approveNote }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Đã phê duyệt đề tài');
      setApproveOpen(false);
      fetchProject();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi phê duyệt');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/research/projects/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Đã từ chối đề tài');
      setRejectOpen(false);
      fetchProject();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi từ chối');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransition = async (action: string, meta: Record<string, unknown> = {}) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/research/projects/${id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...meta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thực hiện thao tác');
      toast.success('Thao tác thành công');
      fetchProject();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi thực hiện thao tác');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.dueDate) {
      toast.error('Vui lòng điền tên mốc và ngày đến hạn');
      return;
    }
    setSavingMilestone(true);
    try {
      const res = await fetch(`/api/research/projects/${id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo mốc');
      toast.success('Đã thêm mốc tiến độ');
      setMilestoneOpen(false);
      setMilestoneForm({ title: '', dueDate: '', note: '' });
      fetchProject();
      fetchMilestones();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleAddReview = async () => {
    if (!reviewForm.reviewType || !reviewForm.reviewDate || !reviewForm.decision) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSavingReview(true);
    try {
      const body = {
        ...reviewForm,
        score: reviewForm.score ? parseFloat(reviewForm.score) : undefined,
      };
      const res = await fetch(`/api/research/projects/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo phiên nghiệm thu');
      toast.success('Đã thêm phiên nghiệm thu');
      setReviewOpen(false);
      setReviewForm({ reviewType: '', reviewDate: '', decision: '', score: '', grade: '', comments: '' });
      fetchProject();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <FlaskConical className="h-8 w-8 text-violet-400 mx-auto animate-pulse" />
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const canApprove = ['SUBMITTED', 'UNDER_REVIEW'].includes(project.status);
  const canSubmit = project.status === 'DRAFT' || project.status === 'REJECTED';
  const canStart = project.status === 'APPROVED';
  const canPause = project.status === 'IN_PROGRESS';
  const canResume = project.status === 'PAUSED';
  const canEnterMidterm = project.status === 'IN_PROGRESS' && project.phase === 'EXECUTION';
  const canEnterFinalReview = project.status === 'IN_PROGRESS' && project.phase === 'MIDTERM_REVIEW';

  const PHASES_ORDER = ['PROPOSAL', 'CONTRACT', 'EXECUTION', 'MIDTERM_REVIEW', 'FINAL_REVIEW', 'ACCEPTED', 'ARCHIVED'];
  const currentPhaseIdx = PHASES_ORDER.indexOf(project.phase);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/research/projects')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                {project.projectCode}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
              {project.budgetYear && (
                <span className="text-xs text-gray-400">Năm {project.budgetYear}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
            {project.titleEn && (
              <p className="text-sm text-gray-500 italic">{project.titleEn}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {/* Duplicate check — always visible */}
          <Button
            variant="outline"
            className="border-violet-200 text-violet-600 hover:bg-violet-50 gap-1"
            onClick={handleDupCheck}
          >
            <ScanSearch className="h-4 w-4" />
            Kiểm tra trùng
          </Button>
          {canSubmit && (
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-1"
              disabled={processing}
              onClick={() => handleTransition('SUBMIT')}
            >
              <Send className="h-4 w-4" />
              Nộp đề tài
            </Button>
          )}
          {canStart && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
              disabled={processing}
              onClick={() => handleTransition('START_EXECUTION')}
            >
              <Play className="h-4 w-4" />
              Bắt đầu thực hiện
            </Button>
          )}
          {canEnterMidterm && (
            <Button
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1"
              disabled={processing}
              onClick={() => handleTransition('ENTER_MIDTERM_REVIEW')}
            >
              <ClipboardList className="h-4 w-4" />
              Kiểm tra giữa kỳ
            </Button>
          )}
          {canEnterFinalReview && (
            <Button
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-50 gap-1"
              disabled={processing}
              onClick={() => handleTransition('ENTER_FINAL_REVIEW')}
            >
              <FileCheck className="h-4 w-4" />
              Vào nghiệm thu
            </Button>
          )}
          {canPause && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-1"
              disabled={processing}
              onClick={() => handleTransition('PAUSE')}
            >
              <Pause className="h-4 w-4" />
              Tạm dừng
            </Button>
          )}
          {canResume && (
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 gap-1"
              disabled={processing}
              onClick={() => handleTransition('RESUME')}
            >
              <RotateCcw className="h-4 w-4" />
              Tiếp tục
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => setApproveOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Phê duyệt
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Phase timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {PHASES_ORDER.map((phase, idx) => (
          <div key={phase} className="flex items-center flex-shrink-0">
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
              idx === currentPhaseIdx
                ? 'bg-violet-100 text-violet-800 font-semibold'
                : idx < currentPhaseIdx
                ? 'text-emerald-600'
                : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                idx === currentPhaseIdx ? 'bg-violet-600' : idx < currentPhaseIdx ? 'bg-emerald-500' : 'bg-gray-300'
              }`} />
              {PHASE_LABELS[phase]}
            </div>
            {idx < PHASES_ORDER.length - 1 && (
              <div className={`h-px w-6 flex-shrink-0 ${idx < currentPhaseIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-violet-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Chủ nhiệm</p>
              <p className="text-sm font-medium truncate">{project.principalInvestigator.name}</p>
              {project.principalInvestigator.rank && (
                <p className="text-xs text-gray-400">{project.principalInvestigator.rank}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Đơn vị</p>
              <p className="text-sm font-medium truncate">{project.unit?.name || '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Kinh phí phê duyệt</p>
              <p className="text-sm font-medium">{vnd(project.budgetApproved)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Thời gian</p>
              <p className="text-sm font-medium">
                {fmtDate(project.startDate)} – {fmtDate(project.endDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap gap-1 h-auto">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="members">
            Thành viên ({project.members.length})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Tiến độ & Mốc ({milestones.length || project.milestones.length})
          </TabsTrigger>
          <TabsTrigger value="publications">
            Công bố ({project.publications.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Nghiệm thu ({project.reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* General Info */}
        <TabsContent value="general">
          <Card>
            <CardContent className="p-6 space-y-3">
              <InfoRow label="Mã đề tài" value={project.projectCode} />
              <InfoRow label="Cấp đề tài" value={CATEGORY_LABELS[project.category] || project.category} />
              <InfoRow label="Lĩnh vực" value={FIELD_LABELS[project.field] || project.field} />
              <InfoRow label="Loại nghiên cứu" value={TYPE_LABELS[project.researchType] || project.researchType} />
              <InfoRow label="Trạng thái" value={STATUS_LABELS[project.status] || project.status} />
              <InfoRow label="Giai đoạn" value={PHASE_LABELS[project.phase] || project.phase} />
              <InfoRow label="Ngày bắt đầu" value={fmtDate(project.startDate)} />
              <InfoRow label="Ngày kết thúc dự kiến" value={fmtDate(project.endDate)} />
              {project.actualEndDate && (
                <InfoRow label="Ngày kết thúc thực tế" value={fmtDate(project.actualEndDate)} />
              )}
              <InfoRow label="Kinh phí yêu cầu" value={vnd(project.budgetRequested)} />
              <InfoRow label="Kinh phí phê duyệt" value={vnd(project.budgetApproved)} />
              <InfoRow label="Kinh phí đã sử dụng" value={vnd(project.budgetUsed)} />
              <InfoRow label="Năm ngân sách" value={project.budgetYear} />
              {project.bqpProjectCode && (
                <InfoRow label="Mã đề tài BQP" value={project.bqpProjectCode} />
              )}
              {project.completionScore != null && (
                <InfoRow label="Điểm nghiệm thu" value={`${project.completionScore} – ${project.completionGrade || ''}`} />
              )}
              {project.approvedAt && (
                <InfoRow label="Ngày phê duyệt" value={fmtDate(project.approvedAt)} />
              )}
              {project.approverNote && (
                <InfoRow label="Ghi chú phê duyệt" value={project.approverNote} />
              )}
              {project.rejectedAt && (
                <>
                  <InfoRow label="Ngày từ chối" value={fmtDate(project.rejectedAt)} />
                  <InfoRow label="Lý do từ chối" value={<span className="text-red-600">{project.rejectReason}</span>} />
                </>
              )}
              {project.abstract && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-1">Tóm tắt:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{project.abstract}</p>
                </div>
              )}
              {project.keywords.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">Từ khóa:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Quân hàm</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Đơn vị/Khoa</TableHead>
                    <TableHead>Ngày tham gia</TableHead>
                    <TableHead className="text-right">Đóng góp (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Chưa có thành viên
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.user.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{m.user.rank || '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'CHU_NHIEM' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                            {MEMBER_ROLE_LABELS[m.role] || m.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{m.user.department || '—'}</TableCell>
                        <TableCell className="text-sm">{fmtDate(m.joinDate)}</TableCell>
                        <TableCell className="text-right text-sm">
                          {m.contribution != null ? `${m.contribution}%` : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones">
          <div className="space-y-4">
            {/* ── Gantt timeline ─────────────────────────────────────── */}
            {(() => {
              const ms = milestones.length > 0 ? milestones : project.milestones;
              if (ms.length === 0) return null;

              // Determine timeline bounds
              const allDates = [
                ...(project.startDate ? [new Date(project.startDate)] : []),
                ...(project.endDate   ? [new Date(project.endDate)]   : []),
                ...ms.map((m) => new Date(m.dueDate)),
                ...ms.filter((m) => m.completedAt).map((m) => new Date(m.completedAt!)),
              ];
              const minTs = Math.min(...allDates.map((d) => d.getTime()));
              const maxTs = Math.max(...allDates.map((d) => d.getTime()));
              const span  = maxTs - minTs || 1;

              // Generate month labels
              const startDate = new Date(minTs);
              const endDate   = new Date(maxTs);
              const months: { label: string; pct: number }[] = [];
              const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
              while (cur <= endDate) {
                const pct = ((cur.getTime() - minTs) / span) * 100;
                months.push({ label: `${cur.getMonth() + 1}/${cur.getFullYear()}`, pct });
                cur.setMonth(cur.getMonth() + 1);
              }

              const GANTT_STATUS_BAR: Record<string, string> = {
                PENDING:     'bg-gray-300',
                IN_PROGRESS: 'bg-blue-400',
                COMPLETED:   'bg-emerald-400',
                OVERDUE:     'bg-red-400',
                CANCELLED:   'bg-gray-200',
              };

              const pct = (ts: number) =>
                Math.max(0, Math.min(100, ((ts - minTs) / span) * 100));

              return (
                <Card>
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Biểu đồ Gantt</p>
                    <span className="text-xs text-gray-400">
                      {new Date(minTs).toLocaleDateString('vi-VN')} → {new Date(maxTs).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <CardContent className="pt-4 pb-3 overflow-x-auto">
                    <div className="min-w-[480px]">
                      {/* Month ruler */}
                      <div className="relative h-5 mb-3 border-b border-gray-100">
                        {months.map((m) => (
                          <span
                            key={m.label}
                            className="absolute text-[10px] text-gray-400 -translate-x-1/2"
                            style={{ left: `${m.pct}%` }}
                          >
                            {m.label}
                          </span>
                        ))}
                      </div>

                      {/* Project bar (if dates available) */}
                      {project.startDate && project.endDate && (
                        <div className="relative h-4 mb-4 bg-gray-100 rounded-full">
                          <div
                            className="absolute h-full rounded-full bg-indigo-200"
                            style={{
                              left:  `${pct(new Date(project.startDate).getTime())}%`,
                              width: `${pct(new Date(project.endDate).getTime()) - pct(new Date(project.startDate).getTime())}%`,
                            }}
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-600 font-medium">
                            Vòng đời đề tài
                          </span>
                        </div>
                      )}

                      {/* Milestone rows */}
                      <div className="space-y-2">
                        {ms.map((m) => {
                          const duePct  = pct(new Date(m.dueDate).getTime());
                          const donePct = m.completedAt ? pct(new Date(m.completedAt).getTime()) : null;
                          return (
                            <div key={m.id} className="flex items-center gap-3">
                              {/* Label */}
                              <div className="w-36 flex-shrink-0 text-xs text-gray-600 truncate text-right pr-2 leading-tight">
                                {m.title}
                              </div>
                              {/* Bar track */}
                              <div className="relative flex-1 h-5 bg-gray-100 rounded-full">
                                {/* Actual completion bar (if done before due) */}
                                {donePct !== null && donePct <= duePct && (
                                  <div
                                    className="absolute h-full rounded-full bg-emerald-300 opacity-60"
                                    style={{ left: 0, width: `${donePct}%` }}
                                  />
                                )}
                                {/* Due date marker */}
                                <div
                                  className={`absolute top-0 h-full w-3 rounded-full -translate-x-1/2 ${GANTT_STATUS_BAR[m.status] ?? 'bg-gray-300'}`}
                                  style={{ left: `${duePct}%` }}
                                  title={`Đến hạn: ${fmtDate(m.dueDate)}`}
                                />
                                {/* Completed marker */}
                                {donePct !== null && (
                                  <div
                                    className="absolute top-0 h-full w-2 rounded-full -translate-x-1/2 bg-emerald-600 border border-white"
                                    style={{ left: `${donePct}%` }}
                                    title={`Hoàn thành: ${fmtDate(m.completedAt!)}`}
                                  />
                                )}
                              </div>
                              {/* Status badge */}
                              <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MILESTONE_STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Đang thực hiện</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Hoàn thành</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Quá hạn</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Chờ thực hiện</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* ── Milestone table ─────────────────────────────────────── */}
            <Card>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-700">Danh sách mốc tiến độ</p>
                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(project.status) && (
                  <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => setMilestoneOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Thêm mốc
                  </Button>
                )}
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mốc tiến độ</TableHead>
                      <TableHead>Ngày đến hạn</TableHead>
                      <TableHead>Ngày hoàn thành</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(milestones.length > 0 ? milestones : project.milestones).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                          Chưa có mốc tiến độ
                        </TableCell>
                      </TableRow>
                    ) : (
                      (milestones.length > 0 ? milestones : project.milestones).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell className="text-sm">{fmtDate(m.dueDate)}</TableCell>
                          <TableCell className="text-sm">
                            {m.completedAt ? fmtDate(m.completedAt) : '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MILESTONE_STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'}`}>
                              {MILESTONE_STATUS_LABELS[m.status] || m.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{m.note || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Publications */}
        <TabsContent value="publications">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Tạp chí/NXB</TableHead>
                    <TableHead>ISI/Scopus</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.publications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        Chưa có công bố liên quan
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.publications.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell>
                          <p className="font-medium text-sm line-clamp-2 max-w-xs">{pub.title}</p>
                        </TableCell>
                        <TableCell className="text-xs">{PUB_TYPE_LABELS[pub.pubType] || pub.pubType}</TableCell>
                        <TableCell className="text-sm">{pub.author.name}</TableCell>
                        <TableCell className="text-sm">{pub.publishedYear || '—'}</TableCell>
                        <TableCell className="text-xs text-gray-500">{pub.journal || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {pub.isISI && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">ISI</span>}
                            {pub.isScopus && <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Scopus</span>}
                            {!pub.isISI && !pub.isScopus && <span className="text-xs text-gray-400">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${pub.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {pub.status === 'PUBLISHED' ? 'Đã xuất bản' : pub.status === 'SUBMITTED' ? 'Đã nộp' : pub.status === 'DRAFT' ? 'Nháp' : 'Từ chối'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <Card>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-medium text-gray-700">Phiên nghiệm thu</p>
              {['APPROVED', 'IN_PROGRESS', 'PAUSED'].includes(project.status) && (
                <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => setReviewOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Thêm nghiệm thu
                </Button>
              )}
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại nghiệm thu</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                    <TableHead>Xếp loại</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Nhận xét</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Chưa có nghiệm thu
                      </TableCell>
                    </TableRow>
                  ) : (
                    project.reviews.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-medium">
                          {REVIEW_TYPE_LABELS[r.reviewType] || r.reviewType}
                        </TableCell>
                        <TableCell className="text-sm">{fmtDate(r.reviewDate)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {r.score != null ? r.score : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{r.grade || '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_DECISION_COLORS[r.decision] || 'bg-gray-100 text-gray-600'}`}>
                            {REVIEW_DECISION_LABELS[r.decision] || r.decision}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 max-w-xs line-clamp-2">
                          {r.comments || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Milestone Dialog */}
      <Dialog open={milestoneOpen} onOpenChange={setMilestoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm mốc tiến độ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Tên mốc <span className="text-red-500">*</span></Label>
              <Input
                placeholder="VD: Hoàn thành khảo sát thực địa"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ngày đến hạn <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={milestoneForm.dueDate}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Textarea
                rows={2}
                placeholder="Ghi chú thêm..."
                value={milestoneForm.note}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneOpen(false)}>Hủy</Button>
            <Button
              onClick={handleAddMilestone}
              disabled={savingMilestone}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingMilestone ? 'Đang lưu...' : 'Thêm mốc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm phiên nghiệm thu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Loại nghiệm thu <span className="text-red-500">*</span></Label>
              <Select value={reviewForm.reviewType} onValueChange={(v) => setReviewForm({ ...reviewForm, reviewType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REVIEW_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ngày nghiệm thu <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={reviewForm.reviewDate}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Kết quả <span className="text-red-500">*</span></Label>
                <Select value={reviewForm.decision} onValueChange={(v) => setReviewForm({ ...reviewForm, decision: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PASSED">Đạt</SelectItem>
                    <SelectItem value="FAILED">Không đạt</SelectItem>
                    <SelectItem value="REVISION_REQUIRED">Cần chỉnh sửa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Điểm (0–100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="VD: 85"
                  value={reviewForm.score}
                  onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Xếp loại</Label>
                <Input
                  placeholder="VD: Xuất sắc, Tốt..."
                  value={reviewForm.grade}
                  onChange={(e) => setReviewForm({ ...reviewForm, grade: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nhận xét</Label>
              <Textarea
                rows={3}
                placeholder="Nhận xét của hội đồng..."
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Hủy</Button>
            <Button
              onClick={handleAddReview}
              disabled={savingReview}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingReview ? 'Đang lưu...' : 'Lưu nghiệm thu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Check Dialog */}
      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-violet-600" />
              Kiểm tra trùng lặp đề tài
            </DialogTitle>
          </DialogHeader>
          {dupChecking ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Đang phân tích {project?.title}...</span>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Risk badge */}
              {dupRisk && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  dupRisk === 'HIGH'   ? 'bg-red-50 text-red-700 border border-red-200' :
                  dupRisk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  dupRisk === 'LOW'    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {dupRisk === 'NONE'   ? 'Không phát hiện đề tài trùng lặp' :
                   dupRisk === 'LOW'    ? 'Rủi ro thấp — có một số đề tài tương đồng nhỏ' :
                   dupRisk === 'MEDIUM' ? 'Rủi ro trung bình — cần xem xét các đề tài sau' :
                                         'Rủi ro cao — phát hiện đề tài rất tương đồng'}
                </div>
              )}
              {/* Match list */}
              {dupMatches.length === 0 && dupRisk !== null ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không tìm thấy đề tài tương đồng trong cơ sở dữ liệu.
                </p>
              ) : (
                <div className="space-y-3">
                  {dupMatches.map((m) => (
                    <div key={m.id} className="border rounded-lg p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{m.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {m.projectCode}
                            {m.principalInvestigatorName && ` · ${m.principalInvestigatorName}`}
                            {m.budgetYear && ` · ${m.budgetYear}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m.similarity >= 0.75 ? 'bg-red-100 text-red-700' :
                            m.similarity >= 0.55 ? 'bg-amber-100 text-amber-700' :
                                                   'bg-yellow-100 text-yellow-700'
                          }`}>
                            {Math.round(m.similarity * 100)}%
                          </span>
                          <a
                            href={`/dashboard/research/projects/${m.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.reasons.map((r, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                            {r}
                          </span>
                        ))}
                        {m.status && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                            {m.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDupOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phê duyệt đề tài</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">
              Bạn đang phê duyệt đề tài: <span className="font-medium">{project.title}</span>
            </p>
            <div className="space-y-1">
              <Label>Ghi chú phê duyệt (tùy chọn)</Label>
              <Textarea
                rows={3}
                placeholder="Nhập ghi chú..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Hủy</Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đề tài</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">
              Bạn đang từ chối đề tài: <span className="font-medium">{project.title}</span>
            </p>
            <div className="space-y-1">
              <Label>Lý do từ chối <span className="text-red-500">*</span></Label>
              <Textarea
                rows={3}
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Hủy</Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
            >
              {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
