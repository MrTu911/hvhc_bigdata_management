'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, LayoutGrid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateCard, type TemplateCardData } from './template-card';
import { TemplateListView } from './template-list-view';
import { TemplateDetailDrawer } from '../detail/template-detail-drawer';

const CATEGORIES: Record<string, string> = {
  NHAN_SU: 'Nhân sự',
  DANG_VIEN: 'Đảng viên',
  BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ',
  KHEN_THUONG: 'Khen thưởng',
  DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH',
  TONG_HOP: 'Tổng hợp',
};

interface TemplateLibraryProps {
  /** Ẩn nút Tạo mới (dùng khi embed trong modal) */
  hideCreate?: boolean;
}

export function TemplateLibrary({ hideCreate = false }: TemplateLibraryProps) {
  const router = useRouter();

  const [templates, setTemplates] = useState<TemplateCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Drawer
  const [drawerTemplateId, setDrawerTemplateId] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TemplateCardData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterFormat) params.set('format', filterFormat);

      const res = await fetch(`/api/templates?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Lỗi tải danh sách');
      setTemplates(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterStatus, filterFormat]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleToggleStatus = async (t: TemplateCardData) => {
    try {
      const res = await fetch(`/api/templates/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(t.isActive ? 'Đã vô hiệu hóa template' : 'Đã kích hoạt template');
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Đã vô hiệu hóa template');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm tên, mã template..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select
          value={filterCategory}
          onValueChange={(v) => { setFilterCategory(v === 'ALL' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
            <SelectValue placeholder="Nhóm nghiệp vụ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả nhóm</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(v) => { setFilterStatus(v === 'ALL' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Vô hiệu</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterFormat}
          onValueChange={(v) => { setFilterFormat(v === 'ALL' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="DOCX">DOCX</SelectItem>
            <SelectItem value="XLSX">XLSX</SelectItem>
            <SelectItem value="PDF">PDF</SelectItem>
            <SelectItem value="HTML">HTML</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={fetchTemplates} title="Làm mới">
          <RefreshCw className="h-4 w-4" />
        </Button>

        {!hideCreate && (
          <Button size="sm" onClick={() => router.push('/dashboard/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo mẫu mới
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <TemplateListView
          templates={templates}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onView={(t) => setDrawerTemplateId(t.id)}
          onEdit={(t) => router.push(`/dashboard/templates/${t.id}`)}
          onToggleStatus={handleToggleStatus}
          onDelete={(t) => setDeleteTarget(t)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              Chưa có mẫu biểu nào
            </div>
          ) : (
            templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onClick={(t) => setDrawerTemplateId(t.id)}
              />
            ))
          )}
          {/* Grid pagination */}
          {total > limit && (
            <div className="col-span-full flex justify-end gap-2 text-sm text-gray-500 items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span>{page} / {Math.ceil(total / limit)}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick-view drawer */}
      <TemplateDetailDrawer
        templateId={drawerTemplateId}
        open={!!drawerTemplateId}
        onClose={() => setDrawerTemplateId(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn vô hiệu hóa mẫu biểu{' '}
            <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Đang xử lý...' : 'Vô hiệu hóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
