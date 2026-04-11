'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Database, Search, FlaskConical, Users, Building2,
  ChevronLeft, ChevronRight, ExternalLink, Shield, ShieldAlert,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type RecordType = 'PROJECT' | 'SCIENTIST' | 'UNIT';

interface ProjectRecord {
  type: 'PROJECT';
  id: string; code: string; title: string; status: string;
  field: string; year: number | null; sensitivity: string;
  pi: { id: string; name: string };
  unit: { id: string; name: string } | null;
  budgetApproved: number | null;
}

interface ScientistRecord {
  type: 'SCIENTIST';
  id: string; name: string; email: string | null; unitName: string | null;
  hIndex: number; totalPublications: number; totalCitations: number;
  academicRank: string | null; primaryField: string | null;
  orcidId: string | null; projectLeadCount: number;
}

interface UnitRecord {
  type: 'UNIT';
  id: string; name: string;
  scientistCount: number; projectCount: number; activeProjects: number;
}

type AnyRecord = ProjectRecord | ScientistRecord | UnitRecord;

// ─── Constants ─────────────────────────────────────────────────────────────────

const TAB_CONFIG: { value: RecordType; label: string; icon: typeof Database }[] = [
  { value: 'PROJECT',   label: 'Đề tài NCKH',   icon: FlaskConical },
  { value: 'SCIENTIST', label: 'Nhà Khoa học',   icon: Users },
  { value: 'UNIT',      label: 'Đơn vị',         icon: Building2 },
];

const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT:       'Nháp',
  SUBMITTED:   'Đã nộp',
  APPROVED:    'Đã duyệt',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED:   'Hoàn thành',
  REJECTED:    'Bị từ chối',
  CANCELLED:   'Đã hủy',
};

const PROJECT_STATUS_COLOR: Record<string, string> = {
  DRAFT:       'bg-gray-100 text-gray-600',
  SUBMITTED:   'bg-blue-100 text-blue-700',
  APPROVED:    'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-red-100 text-red-700',
  CANCELLED:   'bg-gray-100 text-gray-400',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SensitivityIcon({ level }: { level: string }) {
  if (level === 'SECRET')       return <ShieldAlert size={13} className="text-red-500" title="MẬT" />;
  if (level === 'CONFIDENTIAL') return <Shield size={13} className="text-amber-500" title="Bảo mật" />;
  return null;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
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

// ─── Table renderers ───────────────────────────────────────────────────────────

function ProjectTable({ items }: { items: ProjectRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>Tên đề tài</TableHead>
          <TableHead className="w-32">Trạng thái</TableHead>
          <TableHead className="w-28">Lĩnh vực</TableHead>
          <TableHead className="w-16">Năm</TableHead>
          <TableHead>Chủ nhiệm</TableHead>
          <TableHead>Đơn vị</TableHead>
          <TableHead className="w-20 text-right"><span className="sr-only">Chi tiết</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id} className="hover:bg-gray-50">
            <TableCell>
              <div className="flex items-center gap-1.5">
                <SensitivityIcon level={r.sensitivity} />
                <div>
                  <div className="font-medium text-gray-900 text-sm line-clamp-1">{r.title}</div>
                  <div className="text-xs text-gray-400 font-mono">{r.code}</div>
                </div>
              </div>
            </TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-xs text-gray-600">{r.field}</TableCell>
            <TableCell className="text-sm text-gray-600">{r.year ?? '—'}</TableCell>
            <TableCell className="text-sm text-gray-700">{r.pi.name}</TableCell>
            <TableCell className="text-sm text-gray-500">{r.unit?.name ?? '—'}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/science/projects/${r.id}`}>
                  <ExternalLink size={13} />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ScientistTable({ items }: { items: ScientistRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>Nhà khoa học</TableHead>
          <TableHead className="w-32">Đơn vị</TableHead>
          <TableHead className="w-20 text-center">H-index</TableHead>
          <TableHead className="w-24 text-center">Công bố</TableHead>
          <TableHead className="w-24 text-center">Trích dẫn</TableHead>
          <TableHead>Lĩnh vực</TableHead>
          <TableHead className="w-20 text-right"><span className="sr-only">Chi tiết</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id} className="hover:bg-gray-50">
            <TableCell>
              <div className="font-medium text-gray-900 text-sm">{r.name}</div>
              {r.academicRank && <div className="text-xs text-gray-400">{r.academicRank}</div>}
            </TableCell>
            <TableCell className="text-sm text-gray-500">{r.unitName ?? '—'}</TableCell>
            <TableCell className="text-center font-semibold text-violet-700">{r.hIndex}</TableCell>
            <TableCell className="text-center text-sm text-gray-700">{r.totalPublications}</TableCell>
            <TableCell className="text-center text-sm text-gray-700">{r.totalCitations}</TableCell>
            <TableCell className="text-xs text-gray-500">{r.primaryField ?? '—'}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/science/resources/scientists/${r.id}`}>
                  <ExternalLink size={13} />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UnitTable({ items }: { items: UnitRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>Đơn vị</TableHead>
          <TableHead className="w-28 text-center">Nhà KH</TableHead>
          <TableHead className="w-24 text-center">Đề tài</TableHead>
          <TableHead className="w-28 text-center">Đang hoạt động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id} className="hover:bg-gray-50">
            <TableCell className="font-medium text-gray-900 text-sm">{r.name}</TableCell>
            <TableCell className="text-center text-sm text-gray-700">{r.scientistCount}</TableCell>
            <TableCell className="text-center text-sm text-gray-700">{r.projectCount}</TableCell>
            <TableCell className="text-center">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                {r.activeProjects}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataHubRecordsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initType = (searchParams.get('type') as RecordType) || 'PROJECT';
  const [activeType, setActiveType] = useState<RecordType>(initType);
  const [items, setItems]           = useState<AnyRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [keyword, setKeyword]       = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecords = useCallback(async (opts: {
    type: RecordType; keyword: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', opts.type);
      params.set('page', String(opts.page));
      params.set('pageSize', '20');
      if (opts.keyword) params.set('keyword', opts.keyword);

      const res = await fetch(`/api/science/records?${params}`);
      if (!res.ok) throw new Error('Tải dữ liệu thất bại');
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
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetchRecords({ type: activeType, keyword, page });
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [activeType, keyword, page, fetchRecords]);

  const switchType = (type: RecordType) => {
    setActiveType(type);
    setPage(1);
    setKeyword('');
    router.replace(`/dashboard/science/database/records?type=${type}`, { scroll: false });
  };

  const emptyIcon = activeType === 'PROJECT' ? FlaskConical : activeType === 'SCIENTIST' ? Users : Building2;
  const EmptyIcon = emptyIcon;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database size={24} className="text-violet-600" />
          Unified Records — Kho dữ liệu hợp nhất
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Duyệt và tra cứu bản ghi hợp nhất của đề tài, nhà khoa học và đơn vị
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.value}
            onClick={() => switchType(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeType === tab.value
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={
            activeType === 'PROJECT'   ? 'Tìm theo tên, mã đề tài...' :
            activeType === 'SCIENTIST' ? 'Tìm theo tên, email...' :
            'Tìm theo tên đơn vị...'
          }
          className="pl-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <EmptyIcon size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Không có bản ghi nào</p>
            </div>
          ) : activeType === 'PROJECT' ? (
            <ProjectTable items={items as ProjectRecord[]} />
          ) : activeType === 'SCIENTIST' ? (
            <ScientistTable items={items as ScientistRecord[]} />
          ) : (
            <UnitTable items={items as UnitRecord[]} />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Tổng: {total.toLocaleString('vi-VN')} bản ghi</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
