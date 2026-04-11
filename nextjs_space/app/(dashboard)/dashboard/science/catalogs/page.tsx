'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Tags, Search, Plus, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, X,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATALOG_TYPES: { value: string; label: string; color: string }[] = [
  { value: 'FIELD',         label: 'Lĩnh vực NC',    color: 'bg-blue-100 text-blue-700' },
  { value: 'WORK_TYPE',     label: 'Loại công trình', color: 'bg-violet-100 text-violet-700' },
  { value: 'PUBLISHER',     label: 'Nhà xuất bản',   color: 'bg-teal-100 text-teal-700' },
  { value: 'FUND_SOURCE',   label: 'Nguồn kinh phí', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'LEVEL',         label: 'Cấp đề tài',     color: 'bg-amber-100 text-amber-700' },
  { value: 'RESEARCH_AREA', label: 'Chuyên ngành',   color: 'bg-rose-100 text-rose-700' },
];

const TYPE_COLOR_MAP = Object.fromEntries(CATALOG_TYPES.map((t) => [t.value, t.color]));
const TYPE_LABEL_MAP = Object.fromEntries(CATALOG_TYPES.map((t) => [t.value, t.label]));

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CatalogItem {
  id:          string;
  name:        string;
  code:        string;
  type:        string;
  isActive:    boolean;
  description: string | null;
  createdAt:   string;
  parent:      { id: string; name: string; code: string } | null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLOR_MAP[type] ?? 'bg-gray-100 text-gray-500'}`}>
      {TYPE_LABEL_MAP[type] ?? type}
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

// ─── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName]         = useState('');
  const [type, setType]         = useState('');
  const [description, setDesc]  = useState('');
  const [saving, setSaving]     = useState(false);

  const submit = async () => {
    if (!name.trim() || !type) { toast.error('Cần nhập tên và loại danh mục'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/science/catalogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, description: description || undefined }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Tạo thất bại');
      }
      toast.success('Đã tạo danh mục mới');
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Tạo danh mục mới</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại danh mục <span className="text-red-500">*</span></label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
            <SelectContent>
              {CATALOG_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục <span className="text-red-500">*</span></label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={3}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mô tả ngắn (tuỳ chọn)..."
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button onClick={submit} disabled={saving} className="flex-1">
            {saving ? 'Đang lưu...' : 'Tạo danh mục'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScienceCatalogsPage() {
  const [items, setItems]           = useState<CatalogItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling]     = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCatalogs = useCallback(async (opts: {
    keyword: string; type: string; isActive: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(opts.page));
      params.set('pageSize', '30');
      if (opts.keyword)  params.set('keyword', opts.keyword);
      if (opts.type)     params.set('type', opts.type);
      if (opts.isActive) params.set('isActive', opts.isActive);

      const res = await fetch(`/api/science/catalogs?${params}`);
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
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetchCatalogs({ keyword, type: typeFilter, isActive: activeFilter, page });
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [keyword, typeFilter, activeFilter, page, fetchCatalogs]);

  const onFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === 'all' ? '' : v);
    setPage(1);
  };

  const handleToggleActive = async (item: CatalogItem) => {
    setToggling(item.id);
    try {
      const res = await fetch(`/api/science/catalogs/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
      toast.success(item.isActive ? 'Đã ẩn danh mục' : 'Đã kích hoạt danh mục');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  };

  const countByType = Object.fromEntries(
    CATALOG_TYPES.map((t) => [t.value, items.filter((i) => i.type === t.value).length])
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false);
            fetchCatalogs({ keyword, type: typeFilter, isActive: activeFilter, page: 1 });
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tags size={24} className="text-rose-600" />
            Danh mục Khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Lĩnh vực nghiên cứu, loại công trình, nhà xuất bản, nguồn kinh phí
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-1" /> Thêm danh mục
        </Button>
      </div>

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTypeFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !typeFilter
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          Tất cả ({total})
        </button>
        {CATALOG_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTypeFilter(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === t.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm tên, mã danh mục..."
            className="pl-9"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={activeFilter || 'all'} onValueChange={onFilterChange(setActiveFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Đã ẩn</SelectItem>
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
              <Tags size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Chưa có danh mục nào</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus size={14} className="mr-1" /> Tạo danh mục đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead className="w-24 font-mono">Mã</TableHead>
                  <TableHead className="w-32">Loại</TableHead>
                  <TableHead>Danh mục cha</TableHead>
                  <TableHead className="w-40">Mô tả</TableHead>
                  <TableHead className="w-24 text-center">Trạng thái</TableHead>
                  <TableHead className="w-20 text-center">
                    <span className="sr-only">Bật/tắt</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={`hover:bg-gray-50 ${!item.isActive ? 'opacity-50' : ''}`}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{item.code}</TableCell>
                    <TableCell><TypeBadge type={item.type} /></TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {item.parent ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-mono text-xs bg-gray-100 px-1 rounded">{item.parent.code}</span>
                          {item.parent.name}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 max-w-[160px] truncate">
                      {item.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-xs font-medium ${item.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {item.isActive ? 'Hoạt động' : 'Đã ẩn'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={toggling === item.id}
                        className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                        title={item.isActive ? 'Ẩn danh mục' : 'Kích hoạt'}
                      >
                        {item.isActive
                          ? <ToggleRight size={22} className="text-emerald-500" />
                          : <ToggleLeft size={22} />
                        }
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Tổng: {total} danh mục</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
