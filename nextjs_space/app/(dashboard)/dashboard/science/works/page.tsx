'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BookOpen, Search, Plus, ChevronLeft, ChevronRight,
  Shield, ShieldAlert, ShieldCheck, Download, ExternalLink,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const WORK_TYPE_LABELS: Record<string, string> = {
  TEXTBOOK:   'Giáo trình',
  BOOK:       'Sách chuyên khảo',
  MONOGRAPH:  'Chuyên đề',
  REFERENCE:  'Tài liệu tham khảo',
  CURRICULUM: 'Chương trình',
};

const WORK_TYPE_COLOR: Record<string, string> = {
  TEXTBOOK:   'bg-blue-100 text-blue-700',
  BOOK:       'bg-violet-100 text-violet-700',
  MONOGRAPH:  'bg-indigo-100 text-indigo-700',
  REFERENCE:  'bg-teal-100 text-teal-700',
  CURRICULUM: 'bg-emerald-100 text-emerald-700',
};

const SENSITIVITY_CONFIG: Record<string, { label: string; cls: string; Icon: typeof Shield }> = {
  NORMAL:       { label: 'Thường',   cls: 'bg-gray-100 text-gray-600',   Icon: Shield },
  CONFIDENTIAL: { label: 'Bảo mật', cls: 'bg-amber-100 text-amber-700', Icon: ShieldAlert },
  SECRET:       { label: 'MẬT',     cls: 'bg-red-100 text-red-700',     Icon: ShieldCheck },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WorkAuthor {
  authorName: string;
  role:       string;
  orderNum:   number;
}

interface ScientificWork {
  id:          string;
  type:        string;
  title:       string;
  subtitle:    string | null;
  year:        number;
  sensitivity: string;
  doi:         string | null;
  isbn:        string | null;
  edition:     number;
  authors:     WorkAuthor[];
  publisher:   { id: string; name: string } | null;
  createdAt:   string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${WORK_TYPE_COLOR[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {WORK_TYPE_LABELS[type] ?? type}
    </span>
  );
}

function SensitivityBadge({ level }: { level: string }) {
  const cfg = SENSITIVITY_CONFIG[level] ?? SENSITIVITY_CONFIG.NORMAL;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function LeadAuthor({ authors }: { authors: WorkAuthor[] }) {
  const lead = authors.find((a) => a.role === 'LEAD') ?? authors[0];
  if (!lead) return <span className="text-gray-400">—</span>;
  const extra = authors.length - 1;
  return (
    <span className="text-sm text-gray-700">
      {lead.authorName}
      {extra > 0 && <span className="ml-1 text-gray-400 text-xs">+{extra}</span>}
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

export default function ScienceWorksPage() {
  const [items, setItems]             = useState<ScientificWork[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [keyword, setKeyword]         = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [yearFilter, setYearFilter]   = useState('');
  const [senFilter, setSenFilter]     = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWorks = useCallback(async (opts: {
    keyword: string; type: string; year: string; sensitivity: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(opts.page));
      params.set('pageSize', '20');
      if (opts.keyword)     params.set('keyword', opts.keyword);
      if (opts.type)        params.set('type', opts.type);
      if (opts.year)        params.set('year', opts.year);
      if (opts.sensitivity) params.set('sensitivity', opts.sensitivity);

      const res = await fetch(`/api/science/works?${params}`);
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

  // Debounce keyword, immediate on other filters
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetchWorks({ keyword, type: typeFilter, year: yearFilter, sensitivity: senFilter, page });
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [keyword, typeFilter, yearFilter, senFilter, page, fetchWorks]);

  const onFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === 'all' ? '' : v);
    setPage(1);
  };

  // Stats by type from current page
  const countByType = Object.keys(WORK_TYPE_LABELS).reduce<Record<string, number>>((acc, t) => {
    acc[t] = items.filter((w) => w.type === t).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-violet-600" />
            Công trình Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sách, giáo trình, chuyên đề, tài liệu tham khảo
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/science/works/new">
            <Plus size={16} className="mr-1" /> Thêm công trình
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(WORK_TYPE_LABELS).map(([type, label]) => (
          <Card key={type} className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-lg font-bold text-gray-900">{countByType[type] ?? 0}</div>
              <div className={`text-xs mt-0.5 rounded px-1.5 py-0.5 inline-block ${WORK_TYPE_COLOR[type]}`}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, tác giả, ISBN..."
            className="pl-9"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={typeFilter || 'all'} onValueChange={onFilterChange(setTypeFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Loại công trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter || 'all'} onValueChange={onFilterChange(setYearFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm</SelectItem>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={senFilter || 'all'} onValueChange={onFilterChange(setSenFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Phân loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="NORMAL">Thường</SelectItem>
            <SelectItem value="CONFIDENTIAL">Bảo mật</SelectItem>
            <SelectItem value="SECRET">MẬT</SelectItem>
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
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Không có công trình nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Tên công trình</TableHead>
                  <TableHead className="w-32">Loại</TableHead>
                  <TableHead className="w-16">Năm</TableHead>
                  <TableHead className="w-28">Phân loại</TableHead>
                  <TableHead>Tác giả chính</TableHead>
                  <TableHead className="w-20 text-right">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((w) => (
                  <TableRow key={w.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">{w.title}</div>
                      {w.publisher && (
                        <div className="text-xs text-gray-400 mt-0.5">{w.publisher.name}</div>
                      )}
                      {w.doi && (
                        <div className="text-xs text-blue-500 mt-0.5 font-mono">{w.doi}</div>
                      )}
                    </TableCell>
                    <TableCell><TypeBadge type={w.type} /></TableCell>
                    <TableCell className="text-sm text-gray-600">{w.year}</TableCell>
                    <TableCell><SensitivityBadge level={w.sensitivity} /></TableCell>
                    <TableCell><LeadAuthor authors={w.authors ?? []} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/science/works/${w.id}`}>
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
        <p className="text-sm text-gray-500">Tổng: {total} công trình</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
