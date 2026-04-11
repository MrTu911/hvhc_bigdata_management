'use client';

/**
 * M20 — Science Activities: Intake
 * Hiển thị đề tài SUBMITTED — cán bộ tiếp nhận chuyển sang UNDER_REVIEW.
 * Quyền: PROJECT_APPROVE_DEPT | PROJECT_APPROVE_ACADEMY
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Search, ClipboardCheck, ArrowRight, XCircle, RefreshCw, FileText } from 'lucide-react';

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
  sensitivity: string;
  budgetRequested?: number;
  submittedAt?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
}

interface ActionState {
  projectId: string;
  type: 'accept' | 'reject';
}

export default function IntakePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState<ActionState | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'SUBMITTED', pageSize: '50' });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/science/projects?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProjects(data.data);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleAction = useCallback(async () => {
    if (!action || processing) return;
    if (action.type === 'reject' && !comment.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      const toStatus = action.type === 'accept' ? 'UNDER_REVIEW' : 'REJECTED';
      const res = await fetch(`/api/science/projects/${action.projectId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Thao tác thất bại');
      toast.success(action.type === 'accept' ? 'Đã tiếp nhận — chuyển thẩm định' : 'Đã từ chối đề tài');
      setAction(null);
      setComment('');
      await fetchProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }, [action, comment, processing, fetchProjects]);

  const vnd = (n?: number | null) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tiếp nhận đề xuất</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài đã nộp — tiếp nhận để chuyển sang thẩm định, hoặc trả lại nếu chưa đủ điều kiện.
          </p>
        </div>
      </div>

      <ActivityNav active="intake" />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm đề tài..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có đề tài nào đang chờ tiếp nhận.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id} className={`transition-colors ${action?.projectId === p.id ? 'border-violet-300 shadow-sm' : 'hover:border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-violet-600 font-semibold">{p.projectCode}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Đã nộp</span>
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                    </div>
                    <div
                      className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-violet-700 line-clamp-1"
                      onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                    >
                      {p.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{p.principalInvestigator.rank && `${p.principalInvestigator.rank} `}{p.principalInvestigator.name}</span>
                      {p.unit && <span>· {p.unit.name}</span>}
                      {vnd(p.budgetRequested) && <span>· KP: {vnd(p.budgetRequested)}</span>}
                      {p.submittedAt && <span>· Nộp: {new Date(p.submittedAt).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                      className="gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" /> Xem
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setAction({ projectId: p.id, type: 'reject' }); setComment(''); }}
                      className="gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Trả lại
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setAction({ projectId: p.id, type: 'accept' }); setComment(''); }}
                      className="gap-1"
                    >
                      <ArrowRight className="h-3.5 w-3.5" /> Tiếp nhận
                    </Button>
                  </div>
                </div>

                {/* Inline confirm panel */}
                {action?.projectId === p.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {action.type === 'reject' && (
                      <Textarea
                        placeholder="Lý do trả lại (bắt buộc)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="text-sm"
                        autoFocus
                      />
                    )}
                    {action.type === 'accept' && (
                      <Textarea
                        placeholder="Ghi chú tiếp nhận (tuỳ chọn)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={1}
                        className="text-sm"
                        autoFocus
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={action.type === 'reject' ? 'destructive' : 'default'}
                        disabled={processing || (action.type === 'reject' && !comment.trim())}
                        onClick={handleAction}
                        className="gap-1"
                      >
                        {processing
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          : action.type === 'accept'
                          ? <ArrowRight className="h-3.5 w-3.5" />
                          : <XCircle className="h-3.5 w-3.5" />
                        }
                        {action.type === 'accept' ? 'Xác nhận tiếp nhận' : 'Xác nhận trả lại'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setAction(null); setComment(''); }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400">{projects.length} đề tài chờ tiếp nhận</div>
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
