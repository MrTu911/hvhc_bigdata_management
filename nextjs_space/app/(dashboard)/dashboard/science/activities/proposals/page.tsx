'use client';

/**
 * M20 — Science Activities: Proposals
 * Hiển thị đề tài DRAFT và REJECTED — PI view.
 * PI có thể nộp (DRAFT→SUBMITTED) hoặc xem lý do từ chối.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Send, FileEdit, RefreshCw } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    'Nháp',
  REJECTED: 'Bị từ chối',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:    'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-600',
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

export default function ProposalsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'DRAFT' | 'REJECTED' | ''>('');
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '20' });
      // Fetch both DRAFT and REJECTED by requesting each; consolidate client-side
      // Alternatively use keyword+status filter
      if (statusFilter) params.set('status', statusFilter);
      if (keyword) params.set('keyword', keyword);

      // We'll make two requests if no status filter selected, then merge
      if (!statusFilter) {
        const [r1, r2] = await Promise.all([
          fetch(`/api/science/projects?status=DRAFT&pageSize=50`).then(r => r.json()),
          fetch(`/api/science/projects?status=REJECTED&pageSize=50`).then(r => r.json()),
        ]);
        const merged = [
          ...(r1.success ? r1.data : []),
          ...(r2.success ? r2.data : []),
        ].filter((p: Project) =>
          !keyword || p.title.toLowerCase().includes(keyword.toLowerCase()) || p.projectCode.includes(keyword)
        );
        setProjects(merged);
        setMeta({ total: merged.length, page: 1, pageSize: 20, totalPages: 1 });
      } else {
        const res = await fetch(`/api/science/projects?${params}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setProjects(data.data);
        setMeta(data.meta ?? { total: 0, page: 1, pageSize: 20, totalPages: 0 });
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSubmit = useCallback(async (projectId: string) => {
    if (!confirm('Xác nhận nộp đề xuất? Sau khi nộp, đề tài sẽ chuyển sang hàng chờ tiếp nhận.')) return;
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
      await fetchProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đề xuất đề tài</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài đang soạn thảo (Nháp) và bị từ chối — chủ nhiệm có thể nộp hoặc chỉnh sửa lại.
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
        <div className="flex gap-1">
          {([['', 'Tất cả'], ['DRAFT', 'Nháp'], ['REJECTED', 'Bị từ chối']] as const).map(([v, l]) => (
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
          {projects.map((p) => (
            <Card key={p.id} className="hover:border-violet-200 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-violet-600 font-semibold">{p.projectCode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                    <span className="text-xs text-gray-400">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                  </div>
                  <div
                    className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-violet-700"
                    onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                  >
                    {p.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.principalInvestigator.name}
                    {p.unit && ` · ${p.unit.name}`}
                    {' · '}Cập nhật: {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                    className="gap-1"
                  >
                    <FileEdit className="h-3.5 w-3.5" /> Chi tiết
                  </Button>
                  {p.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      disabled={submitting === p.id}
                      onClick={() => handleSubmit(p.id)}
                      className="gap-1"
                    >
                      {submitting === p.id
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />
                      }
                      Nộp đề xuất
                    </Button>
                  )}
                  {p.status === 'REJECTED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                      className="gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Xem & chỉnh sửa
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400">{meta.total} đề tài</div>
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
