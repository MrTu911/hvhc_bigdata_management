'use client';

/**
 * M20 — Science Activities: Proposals
 * Hiển thị đề tài DRAFT/REJECTED (NckhProject) và
 * đề xuất REVISION_REQUESTED/UNIT_APPROVED/DEPT_APPROVED (NckhProposal).
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Send, FileEdit, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT:              'Nháp',
  REJECTED:           'Bị từ chối',
  SUBMITTED:          'Đã nộp',
  REVIEWING:          'Đang xét duyệt',
  REVISION_REQUESTED: 'Cần chỉnh sửa',
  UNIT_APPROVED:      'Bộ môn đã duyệt',
  DEPT_APPROVED:      'Khoa đã duyệt',
  APPROVED:           'Đã phê duyệt',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:              'bg-gray-100 text-gray-600',
  REJECTED:           'bg-red-100 text-red-600',
  SUBMITTED:          'bg-blue-100 text-blue-600',
  REVIEWING:          'bg-yellow-100 text-yellow-700',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-700',
  UNIT_APPROVED:      'bg-teal-100 text-teal-700',
  DEPT_APPROVED:      'bg-indigo-100 text-indigo-700',
  APPROVED:           'bg-green-100 text-green-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  status: string;
  sensitivity: string;
  budgetYear?: number;
  principalInvestigator: { id: string; name: string };
  unit?: { name: string };
  updatedAt: string;
}

// NckhProposal — đề xuất trong luồng mới
interface Proposal {
  id: string;
  title: string;
  status: string;
  category: string;
  currentLevel: string;
  revisionNote?: string | null;
  revisionCount: number;
  pi: { id: string; fullName: string };
  unit?: { name: string } | null;
  updatedAt: string;
  _type: 'proposal';
}

type AnyItem = (Project & { _type: 'project' }) | Proposal;

export default function ProposalsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // NckhProject: DRAFT + REJECTED (hệ thống cũ)
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`/api/science/projects?status=DRAFT&pageSize=50`).then(r => r.json()),
        fetch(`/api/science/projects?status=REJECTED&pageSize=50`).then(r => r.json()),
        // NckhProposal: REVISION_REQUESTED + UNIT_APPROVED + DEPT_APPROVED (luồng mới)
        fetch(`/api/science/proposals?status=REVISION_REQUESTED&pageSize=50`).then(r => r.json()),
        fetch(`/api/science/proposals?status=UNIT_APPROVED&pageSize=50`).then(r => r.json()),
      ]);

      const projects: AnyItem[] = [
        ...(r1.success ? r1.data : []),
        ...(r2.success ? r2.data : []),
      ].map((p: Project) => ({ ...p, _type: 'project' as const }));

      const proposals: AnyItem[] = [
        ...(r3.success ? (r3.items ?? []) : []),
        ...(r4.success ? (r4.items ?? []) : []),
      ].map((p: Omit<Proposal, '_type'>) => ({ ...p, _type: 'proposal' as const }));

      let merged = [...proposals, ...projects];

      if (keyword) {
        merged = merged.filter(item =>
          item.title.toLowerCase().includes(keyword.toLowerCase())
        );
      }
      if (statusFilter) {
        merged = merged.filter(item => item.status === statusFilter);
      }

      setItems(merged);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitProject = useCallback(async (projectId: string) => {
    if (!confirm('Xác nhận nộp đề xuất? Sau khi nộp sẽ chuyển sang hàng chờ tiếp nhận.')) return;
    setSubmitting(projectId);
    try {
      const res = await fetch(`/api/science/projects/${projectId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: 'SUBMITTED', toPhase: 'PROPOSAL' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Nộp thất bại');
      toast.success('Đã nộp đề xuất thành công');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  }, [fetchData]);

  const handleResubmitProposal = useCallback(async (proposalId: string) => {
    if (!confirm('Xác nhận nộp lại đề xuất sau khi chỉnh sửa?')) return;
    setSubmitting(proposalId);
    try {
      const res = await fetch(`/api/science/proposals/${proposalId}/resubmit`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Nộp lại thất bại');
      toast.success(data.message ?? 'Đã nộp lại đề xuất');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đề xuất đề tài</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài nháp, bị từ chối, cần chỉnh sửa, chờ duyệt cấp tiếp theo.
          </p>
        </div>
        <Link href="/dashboard/science/projects/new">
          <Button className="gap-2" size="sm">
            <Plus className="h-4 w-4" /> Tạo đề xuất mới
          </Button>
        </Link>
      </div>

      {/* Breadcrumb activity nav */}
      <ActivityNav active="proposals" />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm đề tài..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {([
            ['', 'Tất cả'],
            ['DRAFT', 'Nháp'],
            ['REJECTED', 'Từ chối'],
            ['REVISION_REQUESTED', 'Cần sửa'],
            ['UNIT_APPROVED', 'Bộ môn duyệt'],
            ['DEPT_APPROVED', 'Khoa duyệt'],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === v
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <FileEdit className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có đề xuất nào. Hãy tạo đề xuất mới!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={`${item._type}-${item.id}`}
              className={`hover:border-violet-200 transition-colors ${
                item.status === 'REVISION_REQUESTED' ? 'border-orange-300 bg-orange-50/30' : ''
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item._type === 'project' && (
                      <span className="font-mono text-xs text-violet-600 font-semibold">{item.projectCode}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <span className="text-xs text-gray-400">{CATEGORY_LABELS[item.category] ?? item.category}</span>
                    {item._type === 'proposal' && item.revisionCount > 0 && (
                      <span className="text-xs text-orange-500">Sửa lần {item.revisionCount}</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {item._type === 'project' ? item.principalInvestigator.name : item.pi.fullName}
                    {item.unit && ` · ${item.unit.name}`}
                    {' · '}Cập nhật: {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                  {/* Hiển thị revisionNote nếu là proposal cần sửa */}
                  {item._type === 'proposal' && item.status === 'REVISION_REQUESTED' && item.revisionNote && (
                    <div className="mt-2 flex items-start gap-1.5 bg-orange-100 rounded p-2">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-orange-700">{item.revisionNote}</p>
                    </div>
                  )}
                  {/* Hiển thị approval progress nếu UNIT/DEPT_APPROVED */}
                  {item._type === 'proposal' && ['UNIT_APPROVED', 'DEPT_APPROVED'].includes(item.status) && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {item.status === 'UNIT_APPROVED' ? 'Đã duyệt cấp Bộ môn — chờ Khoa xét duyệt' : 'Đã duyệt cấp Khoa — chờ Học viện phê duyệt'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item._type === 'project' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/science/projects/${item.id}`)} className="gap-1">
                        <FileEdit className="h-3.5 w-3.5" /> Chi tiết
                      </Button>
                      {item.status === 'DRAFT' && (
                        <Button size="sm" disabled={submitting === item.id} onClick={() => handleSubmitProject(item.id)} className="gap-1">
                          {submitting === item.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Nộp
                        </Button>
                      )}
                    </>
                  )}
                  {item._type === 'proposal' && item.status === 'REVISION_REQUESTED' && (
                    <Button
                      size="sm"
                      disabled={submitting === item.id}
                      onClick={() => handleResubmitProposal(item.id)}
                      className="gap-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {submitting === item.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Nộp lại
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400">{items.length} mục</div>
    </div>
  );
}

function ActivityNav({ active }: { active: 'proposals' | 'intake' | 'review' | 'execution' | 'progress' | 'acceptance' | 'archive' | 'councils' | 'budgets' }) {
  const items = [
    { key: 'proposals',  label: 'Đề xuất',    href: '/dashboard/science/activities/proposals' },
    { key: 'intake',     label: 'Tiếp nhận',  href: '/dashboard/science/activities/intake' },
    { key: 'review',     label: 'Thẩm định',  href: '/dashboard/science/activities/review' },
    { key: 'execution',  label: 'Thực hiện',  href: '/dashboard/science/activities/execution' },
    { key: 'progress',   label: 'Tiến độ',    href: '/dashboard/science/activities/progress' },
    { key: 'acceptance', label: 'Nghiệm thu', href: '/dashboard/science/activities/acceptance' },
    { key: 'archive',    label: 'Lưu trữ',    href: '/dashboard/science/activities/archive' },
    { key: 'councils',   label: 'Hội đồng',   href: '/dashboard/science/activities/councils' },
    { key: 'budgets',    label: 'Ngân sách',  href: '/dashboard/science/activities/budgets' },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
