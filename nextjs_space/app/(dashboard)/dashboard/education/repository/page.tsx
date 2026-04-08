/**
 * M10 – UC-61: Kho tra cứu học vụ & hồ sơ đào tạo
 * /dashboard/education/repository
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search, Archive, FileText, ChevronLeft, ChevronRight,
  ExternalLink, GraduationCap, BookOpen, Award, File,
} from 'lucide-react';

// ============= CONSTANTS =============

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  transcript:  { label: 'Bảng điểm',    icon: <FileText    className="h-3.5 w-3.5" />, className: 'bg-blue-100 text-blue-700'   },
  thesis:      { label: 'Khóa luận',    icon: <BookOpen    className="h-3.5 w-3.5" />, className: 'bg-purple-100 text-purple-700' },
  dossier:     { label: 'Hồ sơ học vụ', icon: <Archive     className="h-3.5 w-3.5" />, className: 'bg-gray-100 text-gray-700'   },
  certificate: { label: 'Chứng chỉ',    icon: <Award       className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-700' },
  other:       { label: 'Khác',         icon: <File        className="h-3.5 w-3.5" />, className: 'bg-orange-100 text-orange-700' },
};

// ============= TYPES =============

interface RepoItem {
  id: string;
  hocVienId: string | null;
  itemType: string;
  title: string;
  fileUrl: string | null;
  metadataJson: Record<string, any> | null;
  isPublic: boolean;
  indexedAt: string;
  createdAt: string;
  hocVien: { id: string; maHocVien: string; hoTen: string; lop: string | null } | null;
}

// ============= PAGE =============

export default function RepositoryPage() {
  const [items, setItems]     = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const limit = 20;

  // Filters
  const [keyword, setKeyword]         = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterPublic, setFilterPublic] = useState('');

  // Debounce keyword
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedKeyword) params.set('keyword', debouncedKeyword);
      if (filterType)       params.set('itemType', filterType);
      if (filterPublic)     params.set('isPublic', filterPublic);

      const res = await fetch(`/api/education/repository/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) { setItems(data.data); setTotal(data.meta.total); }
      }
    } catch { toast.error('Không thể tải kho hồ sơ'); }
    finally   { setLoading(false); }
  }, [page, debouncedKeyword, filterType, filterPublic]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kho tra cứu học vụ</h1>
          <p className="text-muted-foreground">Tìm kiếm hồ sơ đào tạo, bảng điểm, khóa luận, chứng chỉ</p>
        </div>
      </div>

      {/* Type summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(ITEM_TYPE_CONFIG).map(([type, cfg]) => {
          const count = items.filter(i => i.itemType === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all
                ${filterType === type ? 'ring-2 ring-primary ring-offset-1' : 'hover:bg-accent'}
                ${cfg.className}`}
            >
              {cfg.icon}
              <div>
                <div className="text-xs font-medium">{cfg.label}</div>
                <div className="text-lg font-bold">{count}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm theo tiêu đề tài liệu..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={filterType || '__ALL__'} onValueChange={v => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại tài liệu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả loại</SelectItem>
                {Object.entries(ITEM_TYPE_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPublic || '__ALL__'} onValueChange={v => { setFilterPublic(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Phạm vi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                <SelectItem value="true">Công khai</SelectItem>
                <SelectItem value="false">Nội bộ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" />
            {total} tài liệu {debouncedKeyword ? `cho "${debouncedKeyword}"` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tìm kiếm...</div>
          ) : items.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Archive className="h-8 w-8 opacity-30" />
              <span>Không tìm thấy tài liệu nào</span>
              {(keyword || filterType) && (
                <Button variant="ghost" size="sm" onClick={() => { setKeyword(''); setFilterType(''); setFilterPublic(''); }}>
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead>Ngày lưu</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const typeCfg = ITEM_TYPE_CONFIG[item.itemType] ?? ITEM_TYPE_CONFIG.other;
                  const meta = item.metadataJson ?? {};
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm max-w-xs line-clamp-2">{item.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeCfg.className} flex items-center gap-1 w-fit`}>
                          {typeCfg.icon} {typeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.hocVien ? (
                          <div>
                            <div className="text-sm font-medium">{item.hocVien.hoTen}</div>
                            <div className="text-xs text-muted-foreground">{item.hocVien.maHocVien}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {meta.academicYear && <div>Năm: {meta.academicYear}</div>}
                        {meta.semesterCode && <div>HK: {meta.semesterCode}</div>}
                        {meta.programCode  && <div>CT: {meta.programCode}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isPublic ? 'outline' : 'secondary'} className="text-xs">
                          {item.isPublic ? 'Công khai' : 'Nội bộ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(item.indexedAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        {item.fileUrl ? (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" title="Mở file">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">Chưa có file</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page}/{totalPages} ({total} tài liệu)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
