'use client';

/**
 * M23 — Science Councils & Evaluation: Danh sách hội đồng khoa học
 * Actor: quản lý khoa học, chủ tịch hội đồng, cán bộ được phân quyền
 *
 * - Hiển thị tất cả hội đồng, filter theo type/result
 * - Tạo hội đồng mới (COUNCIL_MANAGE)
 * - Nhấn vào để xem chi tiết
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw, Plus, Users, ClipboardList } from 'lucide-react';

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  REVIEW:     'Thẩm định',
  ACCEPTANCE: 'Nghiệm thu',
  FINAL:      'Kết luận cuối',
};

const COUNCIL_RESULT_LABELS: Record<string, string> = {
  PASS:   'Đạt',
  FAIL:   'Không đạt',
  REVISE: 'Cần bổ sung',
};

const RESULT_BADGE: Record<string, string> = {
  PASS:   'bg-emerald-100 text-emerald-700',
  FAIL:   'bg-red-100 text-red-700',
  REVISE: 'bg-amber-100 text-amber-700',
};

interface CouncilItem {
  id: string;
  type: string;
  meetingDate: string | null;
  result: string | null;
  overallScore: number | null;
  createdAt: string;
  project: { id: string; projectCode: string; title: string };
  chairman: { id: string; name: string } | null;
  _count: { members: number; reviews: number };
}

function ActivityNav({ active }: { active: string }) {
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
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto whitespace-nowrap">
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

export default function CouncilsPage() {
  const [councils, setCouncils] = useState<CouncilItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [filterType,   setFilterType]   = useState('');
  const [filterResult, setFilterResult] = useState('');

  const loadCouncils = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:     String(page),
        pageSize: String(pageSize),
      });
      if (filterType)   params.set('type',   filterType);
      if (filterResult) params.set('result', filterResult);

      const res = await fetch(`/api/science/councils?${params}`);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu');
      const json = await res.json();
      setCouncils(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch {
      toast.error('Không thể tải danh sách hội đồng');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterResult]);

  useEffect(() => { loadCouncils(); }, [loadCouncils]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <ActivityNav active="councils" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hội đồng khoa học</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý hội đồng thẩm định, nghiệm thu và kết luận đề tài</p>
        </div>
        <Link href="/dashboard/science/activities/councils/new">
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            Thành lập hội đồng
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">Tất cả loại HĐ</option>
          {Object.entries(COUNCIL_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={filterResult}
          onChange={(e) => { setFilterResult(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="">Tất cả kết quả</option>
          {Object.entries(COUNCIL_RESULT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={loadCouncils} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
        <span className="text-sm text-gray-400 ml-auto">{total} hội đồng</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">Đang tải...</div>
      ) : councils.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
          <ClipboardList className="h-10 w-10 opacity-30" />
          <p>Chưa có hội đồng nào</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {councils.map((c) => (
            <Link key={c.id} href={`/dashboard/science/activities/councils/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          {COUNCIL_TYPE_LABELS[c.type] ?? c.type}
                        </span>
                        {c.result && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULT_BADGE[c.result] ?? 'bg-gray-100 text-gray-600'}`}>
                            {COUNCIL_RESULT_LABELS[c.result] ?? c.result}
                          </span>
                        )}
                        {!c.result && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Đang tiến hành</span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">{c.project.projectCode}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1 truncate">{c.project.title}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                        {c.chairman && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> Chủ tịch: {c.chairman.name}
                          </span>
                        )}
                        <span>{c._count.members} thành viên</span>
                        <span>{c._count.reviews} phiếu chấm</span>
                        {c.overallScore != null && (
                          <span className="text-violet-600 font-medium">ĐTB: {c.overallScore.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      {c.meetingDate
                        ? new Date(c.meetingDate).toLocaleDateString('vi-VN')
                        : 'Chưa xác định ngày'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
