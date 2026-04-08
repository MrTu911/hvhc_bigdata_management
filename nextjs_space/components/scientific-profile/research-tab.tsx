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
import { Plus, Edit, Trash2, FlaskConical, Calendar, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ResearchTabProps {
  data: any[];
  userId: string;
  onUpdate: () => void;
}

const researchRoles = [
  { value: 'CHU_NHIEM', label: 'Chủ nhiệm' },
  { value: 'THAM_GIA', label: 'Tham gia' },
  { value: 'THANH_VIEN', label: 'Thành viên' },
];

const researchLevels = [
  { value: 'Nhà nước', label: 'Nhà nước', color: 'bg-red-100 text-red-800' },
  { value: 'Bộ', label: 'Bộ Quốc phòng', color: 'bg-blue-100 text-blue-800' },
  { value: 'Học viện', label: 'Học viện / Tổng cục', color: 'bg-green-100 text-green-800' },
  { value: 'Khoa', label: 'Khoa / Phòng', color: 'bg-yellow-100 text-yellow-800' },
];

const defaultFormData = {
  title: '',
  year: '',
  role: '',
  level: '',
  type: '',
  institution: '',
  result: '',
  notes: '',
};

export function ResearchTab({ data, userId, onUpdate }: ResearchTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/scientific-profile/research';
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
      const res = await fetch(`/api/scientific-profile/research?id=${id}`, {
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

  // Sort by year descending
  const sortedData = [...data].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Đề tài Nghiên cứu Khoa học</h3>
          <p className="text-sm text-muted-foreground">
            Tổng: {data.length} đề tài
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm đề tài
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Cập nhật' : 'Thêm'} Đề tài Nghiên cứu
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin đề tài nghiên cứu khoa học. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên đề tài *</Label>
                <Textarea
                  required
                  placeholder="Nhập tên đầy đủ của đề tài"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Năm thực hiện *</Label>
                  <Input
                    required
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="VD: 2021"
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
                      {researchRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cấp đề tài *</Label>
                  <Select
                    value={formData.level || ''}
                    onValueChange={(v) => setFormData({ ...formData, level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp" />
                    </SelectTrigger>
                    <SelectContent>
                      {researchLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loại đề tài *</Label>
                  <Input
                    required
                    placeholder="VD: Sáng kiến, Đề tài, Nhiệm vụ"
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Nơi thực hiện</Label>
                <Input
                  placeholder="VD: Học viện Hậu cần"
                  value={formData.institution || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Kết quả đạt được</Label>
                <Textarea
                  placeholder="Mô tả kết quả, thành tích, giải thưởng..."
                  value={formData.result || ''}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  rows={3}
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

      {sortedData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có đề tài nghiên cứu</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm đề tài
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedData.map((item) => {
            const levelInfo = researchLevels.find(l => l.value === item.level);
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {item.year}
                          </Badge>
                          <Badge className={levelInfo?.color || 'bg-gray-100 text-gray-800'}>
                            {item.level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {researchRoles.find(r => r.value === item.role)?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-base leading-relaxed">
                          {item.title}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex gap-1">
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
                {(item.institution || item.result) && (
                  <CardContent className="space-y-2 text-sm">
                    {item.institution && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{item.institution}</span>
                      </div>
                    )}
                    {item.result && (
                      <div className="pt-2 border-t">
                        <p className="font-medium text-sm mb-1">Kết quả:</p>
                        <p className="text-sm text-muted-foreground">{item.result}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
