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
  Library, Search, Upload, Download, Shield, ShieldAlert, ShieldCheck,
  ChevronLeft, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SENSITIVITY_CONFIG: Record<string, { label: string; cls: string; Icon: typeof Shield }> = {
  NORMAL:       { label: 'Thường',      cls: 'bg-gray-100 text-gray-600',   Icon: Shield },
  CONFIDENTIAL: { label: 'Bảo mật',    cls: 'bg-amber-100 text-amber-700', Icon: ShieldAlert },
  SECRET:       { label: 'MẬT',        cls: 'bg-red-100 text-red-700',     Icon: ShieldCheck },
};

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
};

function formatBytes(bytes: string | number): string {
  const n = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LibraryItem {
  id:            string;
  title:         string;
  mimeType:      string;
  fileSize:      string;
  sensitivity:   string;
  isIndexed:     boolean;
  accessCount:   number;
  downloadCount: number;
  createdAt:     string;
  work:          { id: string; title: string; code: string } | null;
  createdBy:     { id: string; name: string } | null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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

function IndexedBadge({ indexed }: { indexed: boolean }) {
  return indexed ? (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <CheckCircle2 size={12} /> Đã index
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <Clock size={12} /> Chưa index
    </span>
  );
}

function MimeTag({ mime }: { mime: string }) {
  const label = MIME_LABELS[mime] ?? 'FILE';
  return (
    <span className="bg-slate-100 text-slate-600 text-xs font-mono px-1.5 py-0.5 rounded">
      {label}
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

// ─── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile]           = useState<File | null>(null);
  const [title, setTitle]         = useState('');
  const [sensitivity, setSensitivity] = useState('NORMAL');
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!file || !title.trim()) { toast.error('Cần chọn file và nhập tiêu đề'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim());
      fd.append('sensitivity', sensitivity);
      const res = await fetch('/api/science/library/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Upload thất bại');
      }
      toast.success('Upload thành công — đang xếp hàng indexing');
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Upload tài liệu</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, Word, Excel, PPT, TXT — tối đa 200MB)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="w-full text-sm border border-gray-300 rounded-lg p-2"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề tài liệu</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mức phân loại</label>
          <Select value={sensitivity} onValueChange={setSensitivity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">Thường</SelectItem>
              <SelectItem value="CONFIDENTIAL">Bảo mật</SelectItem>
              <SelectItem value="SECRET">MẬT (chỉ IP nội bộ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {sensitivity === 'SECRET' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              Tài liệu MẬT chỉ được tải về từ IP nội bộ đã whitelist. Xác nhận trước khi upload.
            </p>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button onClick={submit} disabled={uploading} className="flex-1">
            {uploading ? 'Đang upload...' : 'Upload'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={uploading}>Hủy</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScienceLibraryPage() {
  const [items, setItems]           = useState<LibraryItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [keyword, setKeyword]       = useState('');
  const [senFilter, setSenFilter]   = useState('');
  const [indexedFilter, setIndexedFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async (opts: {
    keyword: string; sensitivity: string; isIndexed: string; page: number;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(opts.page));
      params.set('pageSize', '20');
      if (opts.keyword)     params.set('keyword', opts.keyword);
      if (opts.sensitivity) params.set('sensitivity', opts.sensitivity);
      if (opts.isIndexed)   params.set('isIndexed', opts.isIndexed);

      const res = await fetch(`/api/science/library?${params}`);
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
      fetchItems({ keyword, sensitivity: senFilter, isIndexed: indexedFilter, page });
    }, 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [keyword, senFilter, indexedFilter, page, fetchItems]);

  const onFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === 'all' ? '' : v);
    setPage(1);
  };

  const handleDownload = async (id: string, title: string) => {
    setDownloading(id);
    try {
      const res = await fetch(`/api/science/library/${id}/download`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Tải xuống thất bại');
      window.open(json.data.url, '_blank', 'noopener');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false);
            fetchItems({ keyword, sensitivity: senFilter, isIndexed: indexedFilter, page: 1 });
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Library size={24} className="text-blue-600" />
            Thư viện Số
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tài liệu khoa học — PDF, Word, Excel, PPT</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload size={16} className="mr-1" /> Upload tài liệu
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Tìm theo tiêu đề..."
            className="pl-9"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          />
        </div>
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
        <Select value={indexedFilter || 'all'} onValueChange={onFilterChange(setIndexedFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Trạng thái index" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="true">Đã index</SelectItem>
            <SelectItem value="false">Chưa index</SelectItem>
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
              <Library size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Chưa có tài liệu nào</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowUpload(true)}>
                <Upload size={14} className="mr-1" /> Upload tài liệu đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-16">Loại</TableHead>
                  <TableHead className="w-24">Kích thước</TableHead>
                  <TableHead className="w-28">Phân loại</TableHead>
                  <TableHead className="w-28">Indexing</TableHead>
                  <TableHead className="w-20 text-center">Lượt tải</TableHead>
                  <TableHead className="w-20 text-right">
                    <span className="sr-only">Tải xuống</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                      {item.work && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Công trình: {item.work.title}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.createdBy?.name} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell><MimeTag mime={item.mimeType} /></TableCell>
                    <TableCell className="text-sm text-gray-600">{formatBytes(item.fileSize)}</TableCell>
                    <TableCell><SensitivityBadge level={item.sensitivity} /></TableCell>
                    <TableCell><IndexedBadge indexed={item.isIndexed} /></TableCell>
                    <TableCell className="text-center text-sm text-gray-600">{item.downloadCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={downloading === item.id}
                        onClick={() => handleDownload(item.id, item.title)}
                        title={item.sensitivity === 'SECRET' ? 'Chỉ tải từ IP nội bộ' : 'Tải xuống'}
                      >
                        <Download size={14} className={item.sensitivity === 'SECRET' ? 'text-red-500' : ''} />
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
        <p className="text-sm text-gray-500">Tổng: {total} tài liệu</p>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
