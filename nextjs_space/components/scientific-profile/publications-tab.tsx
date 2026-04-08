'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, BookOpen, FileText, Book, Newspaper } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PublicationsTabProps {
  data: any[];
  userId: string;
  onUpdate: () => void;
}

const publicationTypes = [
  { value: 'GIAO_TRINH', label: 'Giáo trình', icon: Book, color: 'text-blue-600' },
  { value: 'TAI_LIEU', label: 'Tài liệu', icon: FileText, color: 'text-green-600' },
  { value: 'BAI_TAP', label: 'Bài tập', icon: BookOpen, color: 'text-purple-600' },
  { value: 'BAI_BAO', label: 'Bài báo', icon: Newspaper, color: 'text-orange-600' },
];

const publicationRoles = [
  { value: 'CHU_BIEN', label: 'Chủ biên' },
  { value: 'THAM_GIA', label: 'Tham gia' },
  { value: 'DONG_TAC_GIA', label: 'Đồng tác giả' },
];

const defaultFormData = {
  type: '',
  title: '',
  year: '',
  role: '',
  publisher: '',
  issueNumber: '',
  pageNumbers: '',
  targetUsers: '',
  coAuthors: '',
  notes: '',
};

export function PublicationsTab({ data, userId, onUpdate }: PublicationsTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/scientific-profile/publications';
      const method = editing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        userId,
        year: parseInt(formData.year),
        ...(editing && { id: editing.id }),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      toast.success(editing ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      setOpen(false);
      setEditing(null);
      setFormData(defaultFormData);
      onUpdate();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    try {
      const res = await fetch(`/api/scientific-profile/publications?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      toast.success('Xóa thành công!');
      onUpdate();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setFormData({
      ...defaultFormData,
      ...item,
      year: item.year?.toString() || '',
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(defaultFormData);
    setOpen(true);
  };

  // Group by type
  const groupedData = publicationTypes.map((type) => ({
    ...type,
    publications: data
      .filter((item) => item.type === type.value)
      .sort((a, b) => b.year - a.year),
  }));

  const totalCount = data.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Công trình Khoa học</h3>
          <p className="text-sm text-muted-foreground">
            Tổng: {totalCount} công trình
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Cập nhật' : 'Thêm'} Công trình Khoa học
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin công trình khoa học của bạn. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Loại công trình *</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại công trình" />
                  </SelectTrigger>
                  <SelectContent>
                    {publicationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tên công trình *</Label>
                <Textarea
                  required
                  placeholder="Nhập tên đầy đủ của công trình"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Năm xuất bản *</Label>
                  <Input
                    required
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="VD: 2023"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Vai trò *</Label>
                  <Select
                    value={formData.role || ''}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicationRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Nơi xuất bản / Tạp chí</Label>
                <Input
                  placeholder="VD: Học viện Hậu cần, Tạp chí Nghiên cứu KHQH"
                  value={formData.publisher || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, publisher: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số phát hành</Label>
                  <Input
                    placeholder="VD: Số 3(215), tháng 6/2022"
                    value={formData.issueNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, issueNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Số trang</Label>
                  <Input
                    placeholder="VD: 108-111"
                    value={formData.pageNumbers || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, pageNumbers: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Đơn vị sử dụng</Label>
                <Input
                  placeholder="VD: HVHC, Cục KHQS - BQP"
                  value={formData.targetUsers || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, targetUsers: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Đồng tác giả</Label>
                <Input
                  placeholder="VD: Lê Thành Công, Đặng Văn Thắng"
                  value={formData.coAuthors || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, coAuthors: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Ghi chú</Label>
                <Textarea
                  placeholder="Thông tin bổ sung"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có công trình khoa học</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full" defaultValue={groupedData.filter(g => g.publications.length > 0).map(g => g.value)}>
          {groupedData.map((group) => {
            const Icon = group.icon;
            if (group.publications.length === 0) return null;

            return (
              <AccordionItem key={group.value} value={group.value}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${group.color}`} />
                    <span className="font-semibold">{group.label}</span>
                    <Badge variant="secondary">{group.publications.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 mt-2">
                    {group.publications.map((item, index) => (
                      <Card key={item.id} className="border-l-4" style={{ borderLeftColor: group.color.replace('text-', '#') }}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.year}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {publicationRoles.find(r => r.value === item.role)?.label}
                                </Badge>
                              </div>
                              <CardTitle className="text-sm leading-relaxed">
                                {item.title}
                              </CardTitle>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {(item.publisher || item.issueNumber || item.pageNumbers || item.targetUsers || item.coAuthors) && (
                          <CardContent className="pt-0 space-y-1 text-sm text-muted-foreground">
                            {item.publisher && (
                              <div>📚 {item.publisher}</div>
                            )}
                            {item.issueNumber && (
                              <div>📰 {item.issueNumber}</div>
                            )}
                            {item.pageNumbers && (
                              <div>📄 Trang {item.pageNumbers}</div>
                            )}
                            {item.targetUsers && (
                              <div>🏛️ {item.targetUsers}</div>
                            )}
                            {item.coAuthors && (
                              <div>👥 {item.coAuthors}</div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
