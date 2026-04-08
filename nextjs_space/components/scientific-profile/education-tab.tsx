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
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface EducationTabProps {
  data: any[];
  userId: string;
  onUpdate: () => void;
}

const educationLevels = [
  { value: 'DAI_HOC', label: 'Đại học' },
  { value: 'THAC_SI', label: 'Thạc sĩ' },
  { value: 'TIEN_SI', label: 'Tiến sĩ' },
  { value: 'CU_NHAN_NGOAI_NGU', label: 'Cử nhân ngoại ngữ' },
  { value: 'KHAC', label: 'Khác' },
];

const defaultFormData = {
  level: '',
  trainingSystem: '',
  major: '',
  institution: '',
  startDate: '',
  endDate: '',
  thesisTitle: '',
  supervisor: '',
  certificateCode: '',
  certificateDate: '',
  notes: '',
};

export function EducationTab({ data, userId, onUpdate }: EducationTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/scientific-profile/education';
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
      const res = await fetch(`/api/scientific-profile/education?id=${id}`, {
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
      certificateDate: item.certificateDate?.split('T')[0] || '',
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(defaultFormData);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quá trình Đào tạo</h3>
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
                {editing ? 'Cập nhật' : 'Thêm'} Quá trình Đào tạo
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin quá trình đào tạo của bạn. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trình độ *</Label>
                  <Select
                    value={formData.level || ''}
                    onValueChange={(v) => setFormData({ ...formData, level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trình độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hệ đào tạo</Label>
                  <Input
                    placeholder="VD: Chính quy, Tập trung"
                    value={formData.trainingSystem || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, trainingSystem: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Chuyên ngành</Label>
                <Input
                  placeholder="VD: Hậu cần quân sự"
                  value={formData.major || ''}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                />
              </div>

              <div>
                <Label>Cơ sở đào tạo *</Label>
                <Input
                  required
                  placeholder="VD: Học viện Hậu cần"
                  value={formData.institution || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Từ tháng/năm</Label>
                  <Input
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
                </div>
              </div>

              <div>
                <Label>Tên luận văn/luận án</Label>
                <Textarea
                  placeholder="Nhập tên luận văn hoặc luận án"
                  value={formData.thesisTitle || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, thesisTitle: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label>Người hướng dẫn</Label>
                <Input
                  placeholder="VD: Đại tá, PGS, TS Nguyễn Văn A"
                  value={formData.supervisor || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, supervisor: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số hiệu bằng</Label>
                  <Input
                    placeholder="VD: C0008007"
                    value={formData.certificateCode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, certificateCode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Ngày cấp</Label>
                  <Input
                    type="date"
                    value={formData.certificateDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, certificateDate: e.target.value })
                    }
                  />
                </div>
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

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có dữ liệu quá trình đào tạo</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {educationLevels.find((l) => l.value === item.level)?.label || item.level}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.institution}
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
                {item.major && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Chuyên ngành:</span>
                    <span>{item.major}</span>
                  </div>
                )}
                {item.trainingSystem && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Hệ đào tạo:</span>
                    <span>{item.trainingSystem}</span>
                  </div>
                )}
                {(item.startDate || item.endDate) && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Thời gian:</span>
                    <span>
                      {item.startDate && format(new Date(item.startDate), 'MM/yyyy')}
                      {' - '}
                      {item.endDate && format(new Date(item.endDate), 'MM/yyyy')}
                    </span>
                  </div>
                )}
                {item.thesisTitle && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Luận văn:</span>
                    <span>{item.thesisTitle}</span>
                  </div>
                )}
                {item.supervisor && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Hướng dẫn:</span>
                    <span>{item.supervisor}</span>
                  </div>
                )}
                {item.certificateCode && (
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground">Số bằng:</span>
                    <Badge variant="outline">{item.certificateCode}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
