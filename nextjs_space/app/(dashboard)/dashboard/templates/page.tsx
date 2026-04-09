'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Template {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  moduleSource: string[];
  outputFormats: string[];
  version: number;
  isActive: boolean;
  rbacCode: string;
  fileKey?: string;
  createdAt: string;
  updatedAt: string;
}

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

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
  HTML: 'bg-purple-100 text-purple-700',
};

export default function TemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for create/edit
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    moduleSource: [] as string[],
    outputFormats: [] as string[],
    rbacCode: 'EXPORT_DATA',
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterFormat) params.set('format', filterFormat);

      const res = await fetch(`/api/templates?${params}`);
      if (!res.ok) throw new Error('Lỗi tải danh sách template');
      const json = await res.json();
      setTemplates(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterCategory, filterStatus, filterFormat]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!form.code || !form.name || form.outputFormats.length === 0) {
      toast.error('Vui lòng điền đầy đủ: Mã, Tên, và ít nhất 1 định dạng xuất');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          moduleSource: form.moduleSource.length > 0 ? form.moduleSource : ['M02'],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tạo template');
      toast.success('Tạo template thành công');
      setCreateOpen(false);
      resetForm();
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (template: Template) => {
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật trạng thái');
      toast.success(template.isActive ? 'Đã vô hiệu hóa template' : 'Đã kích hoạt template');
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi cập nhật');
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Lỗi xóa template');
      }
      toast.success('Đã vô hiệu hóa template');
      setDeleteOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFormat = (fmt: string) => {
    setForm(prev => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(fmt)
        ? prev.outputFormats.filter(f => f !== fmt)
        : [...prev.outputFormats, fmt],
    }));
  };

  const toggleModule = (mod: string) => {
    setForm(prev => ({
      ...prev,
      moduleSource: prev.moduleSource.includes(mod)
        ? prev.moduleSource.filter(m => m !== mod)
        : [...prev.moduleSource, mod],
    }));
  };

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      description: '',
      category: '',
      moduleSource: [],
      outputFormats: [],
      rbacCode: 'EXPORT_DATA',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện Mẫu biểu (M18)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các mẫu biểu chuẩn BQP – xuất dữ liệu ra PDF, DOCX, XLSX
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/templates/import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/templates/analytics')}>
            <Filter className="h-4 w-4 mr-2" />
            Thống kê
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/templates/export-jobs')}>
            <Download className="h-4 w-4 mr-2" />
            Lịch sử xuất file
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/templates/schedules')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Xuất định kỳ
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo mẫu mới
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Tổng mẫu biểu</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.isActive).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Nhóm nghiệp vụ</p>
          <p className="text-2xl font-bold">{Object.keys(CATEGORIES).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Định dạng hỗ trợ</p>
          <p className="text-2xl font-bold">4</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, mã template..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Nhóm nghiệp vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả nhóm</SelectItem>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Vô hiệu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFormat} onValueChange={v => { setFilterFormat(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Định dạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="DOCX">DOCX</SelectItem>
                <SelectItem value="XLSX">XLSX</SelectItem>
              </SelectContent>
            </Select>
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
            <Button variant="ghost" size="sm" onClick={fetchTemplates}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã / Tên mẫu biểu</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Định dạng</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Phiên bản</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Chưa có mẫu biểu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{t.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{t.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.category ? (
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES[t.category] || t.category}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {t.outputFormats.map(f => (
                            <span
                              key={f}
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[f] || 'bg-gray-100 text-gray-700'}`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {t.moduleSource.map(m => (
                            <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">v{t.version}</span>
                      </TableCell>
                      <TableCell>
                        {t.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />Hoạt động
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0">
                            <XCircle className="h-3 w-3 mr-1" />Vô hiệu
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/${t.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />Chi tiết / Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(t)}>
                              {t.isActive ? (
                                <><XCircle className="mr-2 h-4 w-4" />Vô hiệu hóa</>
                              ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" />Kích hoạt</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => { setSelectedTemplate(t); setDeleteOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />Xóa / Vô hiệu hóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              Chưa có mẫu biểu nào
            </div>
          ) : (
            templates.map(t => (
              <Card
                key={t.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${!t.isActive ? 'opacity-60' : ''}`}
                onClick={() => router.push(`/dashboard/templates/${t.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-blue-500" />
                    {t.isActive ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">Hoạt động</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Vô hiệu</Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-2 leading-tight">{t.name}</CardTitle>
                  <p className="text-xs text-gray-400 font-mono">{t.code}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {t.category && (
                    <Badge variant="outline" className="text-xs mb-2">
                      {CATEGORIES[t.category] || t.category}
                    </Badge>
                  )}
                  <div className="flex gap-1 flex-wrap mt-1">
                    {t.outputFormats.map(f => (
                      <span
                        key={f}
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[f] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">v{t.version}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} mẫu biểu
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3 py-1 border rounded">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo mẫu biểu mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Mã template <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="VD: TMPL_NS_01"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                  className="font-mono"
                />
                <p className="text-xs text-gray-400">Chỉ A-Z, 0-9, _, -</p>
              </div>
              <div className="space-y-1">
                <Label>Nhóm nghiệp vụ</Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tên mẫu biểu <span className="text-red-500">*</span></Label>
              <Input
                placeholder="VD: Lý lịch cán bộ 2A-LLDV"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả mục đích sử dụng mẫu biểu..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Định dạng xuất <span className="text-red-500">*</span></Label>
              <div className="flex gap-4">
                {['PDF', 'DOCX', 'XLSX', 'HTML'].map(fmt => (
                  <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.outputFormats.includes(fmt)}
                      onCheckedChange={() => toggleFormat(fmt)}
                    />
                    <span className={`text-sm px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[fmt] || ''}`}>
                      {fmt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Module nguồn dữ liệu</Label>
              <div className="flex flex-wrap gap-2">
                {['M02', 'M03', 'M04', 'M05', 'M06', 'M08', 'M09'].map(mod => (
                  <label key={mod} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={form.moduleSource.includes(mod)}
                      onCheckedChange={() => toggleModule(mod)}
                    />
                    <span className="text-sm">{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo mẫu biểu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn vô hiệu hóa mẫu biểu{' '}
            <strong>&ldquo;{selectedTemplate?.name}&rdquo;</strong>?
            Template sẽ không còn xuất hiện trong danh sách.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Vô hiệu hóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
