'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Send, CheckCircle2, XCircle, RefreshCw,
  FlaskConical, FileText, Star, Paperclip,
} from 'lucide-react';
import { ScienceAttachmentPanel } from '@/components/science/ScienceAttachmentPanel';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWING: 'Đang thẩm định',
  APPROVED:  'Phê duyệt',
  REJECTED:  'Từ chối',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-amber-100 text-amber-700',
  APPROVED:  'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-red-100 text-red-600',
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

const RECOMMENDATION_LABELS: Record<string, string> = {
  APPROVE: 'Duyệt', REJECT: 'Từ chối', REVISE: 'Chỉnh sửa',
};
const RECOMMENDATION_COLORS: Record<string, string> = {
  APPROVE: 'text-emerald-700', REJECT: 'text-red-600', REVISE: 'text-amber-700',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProposalReview {
  id: string; score?: number; comment?: string; recommendation: string;
  reviewedAt: string;
  reviewer: { id: string; fullName: string };
}

interface Proposal {
  id: string; title: string; titleEn?: string; abstract?: string;
  keywords: string[]; researchType: string; category: string; field: string;
  budgetRequested?: number; durationMonths?: number;
  status: string; submittedAt?: string; reviewDeadline?: string;
  createdAt: string; updatedAt: string;
  pi: { id: string; fullName: string };
  unit?: { id: string; name: string };
  approvedBy?: { id: string; fullName: string };
  reviews: ProposalReview[];
  project?: { id: string; projectCode: string; status: string };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const vnd = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : '—';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/proposals/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi tải đề xuất');
      setProposal(json.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  const handleSubmit = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/science/proposals/${id}/submit`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi nộp đề xuất');
      toast.success('Đã nộp đề xuất thành công');
      fetchProposal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi nộp đề xuất');
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/science/proposals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectNote: rejectNote.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Thao tác thất bại');
      toast.success(action === 'APPROVE'
        ? `Đã phê duyệt — mã đề tài: ${json.data?.projectCode ?? ''}`
        : 'Đã từ chối đề xuất');
      if (action === 'APPROVE' && json.data?.projectId) {
        router.push(`/dashboard/science/projects/${json.data.projectId}`);
      } else {
        fetchProposal();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setActing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!proposal) return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <p className="text-muted-foreground mb-4">Không tìm thấy đề xuất.</p>
      <Link href="/dashboard/science/activities/proposals">
        <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 p-6">

      {/* Header */}
      <div>
        <Link href="/dashboard/science/activities/proposals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Danh sách đề xuất
        </Link>
        <div className="flex items-start gap-3">
          <FlaskConical className="h-6 w-6 text-violet-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-snug">{proposal.title}</h1>
            {proposal.titleEn && <p className="text-sm text-muted-foreground mt-0.5 italic">{proposal.titleEn}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[proposal.status] ?? 'bg-gray-100'}`}>
                {STATUS_LABELS[proposal.status] ?? proposal.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[proposal.category] ?? proposal.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {FIELD_LABELS[proposal.field] ?? proposal.field}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Linked project notice */}
      {proposal.project && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-emerald-800">
            Đề xuất đã được duyệt → Đề tài{' '}
            <Link href={`/dashboard/science/projects/${proposal.project.id}`}
              className="font-semibold underline">
              {proposal.project.projectCode}
            </Link>
          </span>
        </div>
      )}

      {/* Action panel */}
      {proposal.status === 'DRAFT' && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800 mb-3 font-medium">Đề xuất đang ở trạng thái Nháp</p>
            <Button size="sm" onClick={handleSubmit} disabled={acting} className="gap-2">
              {acting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Nộp đề xuất
            </Button>
          </CardContent>
        </Card>
      )}

      {(proposal.status === 'SUBMITTED' || proposal.status === 'REVIEWING') && (
        <Card className="border-violet-200 bg-violet-50/40">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-violet-800">Phê duyệt đề xuất</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove('APPROVE')} disabled={acting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Phê duyệt
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleApprove('REJECT')} disabled={acting}
                className="gap-2">
                <XCircle className="h-3.5 w-3.5" /> Từ chối
              </Button>
            </div>
            <Textarea
              placeholder="Lý do từ chối (bắt buộc nếu từ chối)..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={2}
              className="text-sm bg-white"
            />
          </CardContent>
        </Card>
      )}

      {proposal.status === 'REJECTED' && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4">
            <p className="text-sm text-red-800 font-medium">Đề xuất đã bị từ chối</p>
            {proposal.approvedBy && (
              <p className="text-xs text-muted-foreground mt-1">Bởi: {proposal.approvedBy.fullName}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Thông tin đề xuất</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 grid grid-cols-2 gap-4">
              <InfoRow label="Cấp đề tài" value={CATEGORY_LABELS[proposal.category] ?? proposal.category} />
              <InfoRow label="Lĩnh vực" value={FIELD_LABELS[proposal.field] ?? proposal.field} />
              <InfoRow label="Loại nghiên cứu" value={proposal.researchType} />
              <InfoRow label="Thời gian thực hiện" value={proposal.durationMonths ? `${proposal.durationMonths} tháng` : undefined} />
              <InfoRow label="Kinh phí đề xuất" value={vnd(proposal.budgetRequested)} />
              <InfoRow label="Hạn chót thẩm định" value={proposal.reviewDeadline ? new Date(proposal.reviewDeadline).toLocaleDateString('vi-VN') : undefined} />
              <InfoRow label="Ngày nộp" value={proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('vi-VN') : undefined} />
              <InfoRow label="Đơn vị" value={proposal.unit?.name} />
            </CardContent>
          </Card>

          {/* Abstract */}
          {proposal.abstract && (
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Tóm tắt đề xuất
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.abstract}</p>
                {proposal.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {proposal.keywords.map((kw) => (
                      <span key={kw} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tài liệu đính kèm */}
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Tài liệu đính kèm
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScienceAttachmentPanel
                entityType="PROPOSAL"
                entityId={id}
                allowUpload={proposal.status === 'DRAFT'}
                allowDelete={proposal.status === 'DRAFT'}
              />
            </CardContent>
          </Card>

          {/* Reviews */}
          {proposal.reviews.length > 0 && (
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4" /> Kết quả thẩm định ({proposal.reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {proposal.reviews.map((rv) => (
                  <div key={rv.id} className="border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{rv.reviewer.fullName}</span>
                      <div className="flex items-center gap-2">
                        {rv.score != null && (
                          <span className="text-xs font-bold text-violet-700">{rv.score} điểm</span>
                        )}
                        <span className={`text-xs font-medium ${RECOMMENDATION_COLORS[rv.recommendation] ?? ''}`}>
                          {RECOMMENDATION_LABELS[rv.recommendation] ?? rv.recommendation}
                        </span>
                      </div>
                    </div>
                    {rv.comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{rv.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(rv.reviewedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: PI info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Chủ nhiệm đề xuất</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm font-medium">{proposal.pi.fullName}</p>
              {proposal.unit && (
                <p className="text-xs text-muted-foreground mt-0.5">{proposal.unit.name}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <InfoRow label="Tạo lúc" value={new Date(proposal.createdAt).toLocaleDateString('vi-VN')} />
              <InfoRow label="Cập nhật" value={new Date(proposal.updatedAt).toLocaleDateString('vi-VN')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
