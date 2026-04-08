'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface WorkExperienceTabProps {
  data: any[];
  userId: string;
  onUpdate: () => void;
}

const defaultFormData = {
  organization: '',
  position: '',
  startDate: '',
  endDate: '',
  description: '',
};

export function WorkExperienceTab({ data, userId, onUpdate }: WorkExperienceTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/scientific-profile/work-experience';
      const method = editing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        userId,
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
      const res = await fetch(`/api/scientific-profile/work-experience?id=${id}`, {
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
      startDate: item.startDate?.split('T')[0] || '',
      endDate: item.endDate?.split('T')[0] || '',
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(defaultFormData);
    setOpen(true);
  };

  // Sắp xếp theo thời gian giảm dần (mới nhất lên đầu)
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quá trình Công tác Chuyên môn</h3>
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
                {editing ? 'Cập nhật' : 'Thêm'} Quá trình Công tác
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin quá trình công tác chuyên môn của bạn. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nơi công tác *</Label>
                <Input
                  required
                  placeholder="VD: Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần"
                  value={formData.organization || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Công việc đảm nhiệm *</Label>
                <Input
                  required
                  placeholder="VD: Giảng viên, Trung đội trưởng"
                  value={formData.position || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Từ tháng/năm *</Label>
                  <Input
                    required
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Đến tháng/năm</Label>
                  <Input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Để trống nếu đang công tác tại đây
                  </p>
                </div>
              </div>

              <div>
                <Label>Mô tả chi tiết</Label>
                <Textarea
                  placeholder="Mô tả công việc, trách nhiệm, thành tích..."
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
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

      {sortedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có dữ liệu quá trình công tác</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedData.map((item, index) => {
            const isCurrentJob = !item.endDate;
            return (
              <Card key={item.id} className={isCurrentJob ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{item.position}</CardTitle>
                          {isCurrentJob && (
                            <Badge variant="default" className="bg-green-600">
                              Hiện tại
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.organization}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(item.startDate), 'MM/yyyy')}
                      {' → '}
                      {item.endDate ? format(new Date(item.endDate), 'MM/yyyy') : 'Hiện tại'}
                    </span>
                  </div>
                  {item.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm">{item.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
