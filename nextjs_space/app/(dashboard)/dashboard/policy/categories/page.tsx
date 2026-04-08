/**
 * Quản lý Danh mục Chính sách
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FolderTree, Loader2, CheckCircle, XCircle, Settings } from 'lucide-react';

interface PolicyCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  requiresApproval: boolean;
  approvalLevels: number;
  isActive: boolean;
  sortOrder: number;
  parent?: { id: string; code: string; name: string } | null;
  children?: { id: string; code: string; name: string; isActive: boolean }[];
  _count?: { requests: number };
}

export default function PolicyCategoriesPage() {
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  
  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<PolicyCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<PolicyCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    parentId: '',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 0,
    isActive: true,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/policy/categories?includeInactive=${includeInactive}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      description: '',
      parentId: '',
      requiresApproval: true,
      approvalLevels: 1,
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleOpenEdit = (cat: PolicyCategory) => {
    setForm({
      code: cat.code,
      name: cat.name,
      description: cat.description || '',
      parentId: cat.parentId || '',
      requiresApproval: cat.requiresApproval,
      approvalLevels: cat.approvalLevels,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setEditCategory(cat);
  };

  const handleCreate = async () => {
    if (!form.code || !form.name) {
      toast.error('Vui lòng nhập mã và tên danh mục');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/policy/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          parentId: form.parentId || null,
        }),
      });
      if (res.ok) {
        toast.success('Tạo danh mục thành công');
        setShowCreate(false);
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi tạo danh mục');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editCategory) return;
    setSaving(true);
    try {
      const res = await fetch('/api/policy/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCategory.id,
          ...form,
          parentId: form.parentId || null,
        }),
      });
      if (res.ok) {
        toast.success('Cập nhật thành công');
        setEditCategory(null);
        fetchCategories();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi cập nhật');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/policy/categories?id=${deleteCategory.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Xóa thành công');
        setDeleteCategory(null);
        fetchCategories();
      } else {
        toast.error('Lỗi xóa danh mục');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setDeleting(false);
    }
  };

  // Get parent categories for selection
  const getParentOptions = () => {
    return categories.filter(c => {
      if (!editCategory) return true;
      if (c.id === editCategory.id) return false;
      if (editCategory.children?.some(child => child.id === c.id)) return false;
      return true;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-amber-600" />
            Quản lý Danh mục Chính sách
          </h1>
          <p className="text-gray-500 mt-1">Thiết lập các danh mục chính sách, thi đua, khen thưởng</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {/* Options */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <Switch checked={includeInactive} onCheckedChange={setIncludeInactive} />
            <Label>Hiển thị cả danh mục không hoạt động</Label>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Mã</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Danh mục cha</TableHead>
                <TableHead className="text-center">Cấp duyệt</TableHead>
                <TableHead className="text-center">Yêu cầu</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Chưa có danh mục nào
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} className={!cat.isActive ? 'opacity-50' : ''}>
                    <TableCell><Badge variant="outline">{cat.code}</Badge></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-sm text-gray-500 truncate max-w-xs">{cat.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat.parent ? <Badge variant="secondary">{cat.parent.name}</Badge> : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-center"><Badge>{cat.approvalLevels} cấp</Badge></TableCell>
                    <TableCell className="text-center"><span className="text-sm text-gray-500">{cat._count?.requests || 0}</span></TableCell>
                    <TableCell className="text-center">
                      {cat.isActive ? (
                        <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Hoạt động</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Tắt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteCategory(cat)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm danh mục mới</DialogTitle>
            <DialogDescription>Tạo danh mục chính sách mới</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã danh mục *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VD: CS_KHEN_THUONG" />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tên danh mục *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Khen thưởng" />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả chi tiết..." />
            </div>
            <div className="space-y-2">
              <Label>Danh mục cha</Label>
              <Select value={form.parentId || 'none'} onValueChange={v => setForm(f => ({ ...f, parentId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Không có (gốc)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (gốc)</SelectItem>
                  {getParentOptions().map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số cấp duyệt</Label>
                <Select value={form.approvalLevels.toString()} onValueChange={v => setForm(f => ({ ...f, approvalLevels: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 cấp</SelectItem>
                    <SelectItem value="2">2 cấp</SelectItem>
                    <SelectItem value="3">3 cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.requiresApproval} onCheckedChange={v => setForm(f => ({ ...f, requiresApproval: v }))} />
                <Label>Yêu cầu phê duyệt</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa danh mục</DialogTitle>
            <DialogDescription>{editCategory?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã danh mục *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tên danh mục *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Danh mục cha</Label>
              <Select value={form.parentId || 'none'} onValueChange={v => setForm(f => ({ ...f, parentId: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Không có (gốc)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (gốc)</SelectItem>
                  {getParentOptions().map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số cấp duyệt</Label>
                <Select value={form.approvalLevels.toString()} onValueChange={v => setForm(f => ({ ...f, approvalLevels: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 cấp</SelectItem>
                    <SelectItem value="2">2 cấp</SelectItem>
                    <SelectItem value="3">3 cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.requiresApproval} onCheckedChange={v => setForm(f => ({ ...f, requiresApproval: v }))} />
                <Label>Yêu cầu phê duyệt</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label>Đang hoạt động</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>Hủy</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa danh mục <strong>{deleteCategory?.name}</strong>?
              {(deleteCategory?._count?.requests || 0) > 0 && (
                <span className="block mt-2 text-amber-600">
                  Lưu ý: Danh mục này có {deleteCategory?._count?.requests} yêu cầu. Danh mục sẽ được vô hiệu hóa thay vì xóa.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
