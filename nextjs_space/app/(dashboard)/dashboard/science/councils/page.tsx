'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, ChevronLeft, ChevronRight, ExternalLink, CalendarDays,
  CheckCircle2, XCircle, RefreshCw, Clock,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  REVIEW:     'Thẩm định',
  ACCEPTANCE: 'Nghiệm thu',
  FINAL:      'Tổng kết',
};

const COUNCIL_TYPE_COLOR: Record<string, string> = {
  REVIEW:     'bg-blue-100 text-blue-700',
  ACCEPTANCE: 'bg-violet-100 text-violet-700',
  FINAL:      'bg-emerald-100 text-emerald-700',
};

const RESULT_CONFIG: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  PASS:   { label: 'Đạt',      cls: 'text-emerald-600', Icon: CheckCircle2 },
  FAIL:   { label: 'Không đạt', cls: 'text-red-500',    Icon: XCircle },
  REVISE: { label: 'Sửa đổi',  cls: 'text-amber-600',  Icon: RefreshCw },
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CouncilItem {
  id:           string;
  type:         string;
  meetingDate:  string | null;
  result:       string | null;
  overallScore: number | null;
  createdAt:    string;
  project:      { id: string; projectCode: string; title: string } | null;
  chairman:     { id: string; name: string } | null;
  _count:       { members: number; reviews: number };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COUNCIL_TYPE_COLOR[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {COUNCIL_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function ResultCell({ result }: { result: string | null }) {
  if (!result) {
    return <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> Chưa kết luận</span>;
  }
  const cfg = RESULT_CONFIG[result];
  if (!cfg) return <span className="text-xs text-gray-500">{result}</span>;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`}>
      <Icon size={13} /> {cfg.label}
    </span>
  );
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScienceCouncilsPage() {
  const [items, setItems]           = useState<CouncilItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const fetchCouncils = useCallback(async (opts: {
    type: string; result: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(opts.page));
      params.set('pageSize', '20');
      if (opts.type)   params.set('type', opts.type);
      if (opts.result) params.set('result', opts.result);

      const res = await fetch(`/api/science/councils?${params}`);
      if (!res.ok) throw new Error('Tải danh sách thất bại');
      const json = await res.json();
      setItems(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setTotalPages(json.meta?.totalPages ?? 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouncils({ type: typeFilter, result: resultFilter, page });
  }, [typeFilter, resultFilter, page, fetchCouncils]);

  const onFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === 'all' ? '' : v);
    setPage(1);
  };

  // Tính thống kê nhanh từ dữ liệu hiện tại
  const passed   = items.filter((c) => c.result === 'PASS').length;
  const failed   = items.filter((c) => c.result === 'FAIL').length;
  const pending  = items.filter((c) => !c.result).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Hội đồng Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Thẩm định, nghiệm thu và tổng kết đề tài</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/science/councils/new">
            <Users size={16} className="mr-1" /> Lập hội đồng
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Đã đạt',        value: passed,  cls: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Chưa kết luận', value: pending, cls: 'text-gray-500',   bg: 'bg-gray-50' },
          { label: 'Không đạt',     value: failed,  cls: 'text-red-500',    bg: 'bg-red-50' },
        ].map(({ label, value, cls, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className={`pt-4 pb-3 px-4 ${bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter || 'all'} onValueChange={onFilterChange(setTypeFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Loại hội đồng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(COUNCIL_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resultFilter || 'all'} onValueChange={onFilterChange(setResultFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Kết quả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PASS">Đạt</SelectItem>
            <SelectItem value="FAIL">Không đạt</SelectItem>
            <SelectItem value="REVISE">Sửa đổi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Chưa có hội đồng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Đề tài</TableHead>
                  <TableHead className="w-28">Loại HĐ</TableHead>
                  <TableHead className="w-36">Ngày họp</TableHead>
                  <TableHead>Chủ tịch HĐ</TableHead>
                  <TableHead className="w-20 text-center">TV</TableHead>
                  <TableHead className="w-20 text-center">Điểm TB</TableHead>
                  <TableHead className="w-32">Kết quả</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Chi tiết</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {c.project?.title ?? '—'}
                      </div>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">
                        {c.project?.projectCode}
                      </div>
                    </TableCell>
                    <TableCell><TypeBadge type={c.type} /></TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.meetingDate
                        ? (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} className="text-gray-400" />
                            {new Date(c.meetingDate).toLocaleDateString('vi-VN')}
                          </span>
                        )
                        : <span className="text-gray-400">Chưa xác định</span>
                      }
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {c.chairman?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {c._count.members}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-gray-700">
                      {c.overallScore != null ? c.overallScore.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell><ResultCell result={c.result} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/science/councils/${c.id}`}>
                          <ExternalLink size={14} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Tổng: {total} hội đồng</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
