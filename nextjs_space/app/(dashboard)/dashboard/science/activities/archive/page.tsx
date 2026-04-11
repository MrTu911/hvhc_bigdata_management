'use client';

/**
 * M20 — Science Activities: Archive
 * Hiển thị đề tài đã lưu trữ (status=COMPLETED, phase=ARCHIVED). Read-only.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, FileText, Archive, Star,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật QS',
  HAU_CAN_KY_THUAT:  'Hậu cần KT',
  KHOA_HOC_XA_HOI:   'KHXH',
  KHOA_HOC_TU_NHIEN: 'KHTN',
  CNTT:              'CNTT',
  Y_DUOC:            'Y Dược',
  KHAC:              'Khác',
};

interface ArchivedProject {
  id: string;
  projectCode: string;
  title: string;
  titleEn?: string;
  category: string;
  field: string;
  status: string;
  phase: string;
  completionScore?: number;
  completionGrade?: string;
  budgetApproved?: number;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
  bqpProjectCode?: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
      const res = await fetch(
        `/api/science/projects?status=COMPLETED&phase=ARCHIVED&page=${page}&pageSize=${pageSize}${kw}`
      ).then(r => r.json());

      if (!res.success) throw new Error('Lỗi tải dữ liệu');
      const data = res.data;
      setProjects(data.items ?? data);
      setTotal(data.total ?? (data.items ?? data).length);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const vnd = (n?: number | null) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kho lưu trữ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài đã hoàn thành và lưu trữ chính thức. Chỉ đọc.
          </p>
        </div>
        {total > 0 && (
          <span className="text-sm text-gray-500">{total} đề tài lưu trữ</span>
        )}
      </div>

      <ActivityNav active="archive" />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm đề tài..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Archive className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có đề tài nào được lưu trữ.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {projects.map((p) => (
              <Card key={p.id} className="hover:border-gray-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-violet-600 font-semibold">{p.projectCode}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                          <Archive className="h-3 w-3" /> Lưu trữ
                        </span>
                        <span className="text-xs text-gray-400">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                        <span className="text-xs text-gray-400">{FIELD_LABELS[p.field] ?? p.field}</span>
                        {p.bqpProjectCode && (
                          <span className="text-xs text-gray-400 font-mono">BQP: {p.bqpProjectCode}</span>
                        )}
                      </div>

                      <div
                        className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-violet-700 line-clamp-2"
                        onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                      >
                        {p.title}
                      </div>
                      {p.titleEn && (
                        <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{p.titleEn}</p>
                      )}

                      <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-4 flex-wrap">
                        <span>
                          {p.principalInvestigator.rank && `${p.principalInvestigator.rank} `}
                          {p.principalInvestigator.name}
                        </span>
                        {p.unit && <span>{p.unit.name}</span>}

                        {p.startDate && p.endDate && (
                          <span>
                            {new Date(p.startDate).getFullYear()}–{new Date(p.actualEndDate ?? p.endDate).getFullYear()}
                          </span>
                        )}

                        {vnd(p.budgetApproved) && (
                          <span>KP: {vnd(p.budgetApproved)}</span>
                        )}

                        {(p.completionGrade || p.completionScore != null) && (
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <Star className="h-3 w-3" />
                            {p.completionGrade ?? ''}
                            {p.completionScore != null && ` (${p.completionScore}/10)`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                        className="gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" /> Xem
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-500">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ActivityNav ───────────────────────────────────────────────────────────────

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
