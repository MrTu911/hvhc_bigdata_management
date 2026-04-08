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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Award, AlertTriangle, Trophy, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AwardsTabProps {
  data: any[];
  userId: string;
  onUpdate: () => void;
}

const awardCategories = [
  { value: 'Bằng khen', label: 'Bằng khen', icon: Trophy, color: 'text-yellow-600' },
  { value: 'Giấy khen', label: 'Giấy khen', icon: Award, color: 'text-blue-600' },
  { value: 'Chiến sĩ thi đua cơ sở', label: 'CSTT cơ sở', icon: Star, color: 'text-green-600' },
  { value: 'Khác', label: 'Khác', icon: Award, color: 'text-gray-600' },
];

const defaultFormData = {
  type: '',
  category: '',
  description: '',
  year: '',
  awardedBy: '',
  notes: '',
};

export function AwardsTab({ data, userId, onUpdate }: AwardsTabProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/scientific-profile/awards';
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
      const res = await fetch(`/api/scientific-profile/awards?id=${id}`, {
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

  const handleAdd = (type: 'KHEN_THUONG' | 'KY_LUAT') => {
    setEditing(null);
    setFormData({ ...defaultFormData, type });
    setOpen(true);
  };

  // Phân loại theo type
  const rewards = data
    .filter((item) => item.type === 'KHEN_THUONG')
    .sort((a, b) => b.year - a.year);
  const disciplines = data
    .filter((item) => item.type === 'KY_LUAT')
    .sort((a, b) => b.year - a.year);

  // Group rewards by category
  const groupedRewards: Record<string, any[]> = {};
  rewards.forEach((item) => {
    if (!groupedRewards[item.category]) {
      groupedRewards[item.category] = [];
    }
    groupedRewards[item.category].push(item);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Khen thưởng & Kỷ luật</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Cập nhật' : 'Thêm'} {formData.type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin khen thưởng hoặc kỷ luật. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Loại *</Label>
                <Select
                  value={formData.type || ''}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KHEN_THUONG">Khen thưởng</SelectItem>
                    <SelectItem value="KY_LUAT">Kỷ luật</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hình thức *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'KHEN_THUONG' ? (
                      <>
                        <SelectItem value="Bằng khen">Bằng khen</SelectItem>
                        <SelectItem value="Giấy khen">Giấy khen</SelectItem>
                        <SelectItem value="Chiến sĩ thi đua cơ sở">Chiến sĩ thi đua cơ sở</SelectItem>
                        <SelectItem value="Chiến sĩ thi đua cấp trên">Chiến sĩ thi đua cấp trên</SelectItem>
                        <SelectItem value="Huân chương">Huân chương</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Khiển trách">Khiển trách</SelectItem>
                        <SelectItem value="Cảnh cáo">Cảnh cáo</SelectItem>
                        <SelectItem value="Hạ bậc lương">Hạ bậc lương</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mô tả *</Label>
                <Textarea
                  required
                  placeholder="Lý do, thành tích hoặc vi phạm"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Năm *</Label>
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
                  <Label>Đơn vị trao</Label>
                  <Input
                    placeholder="VD: BQP, HVHC"
                    value={formData.awardedBy || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, awardedBy: e.target.value })
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

      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rewards">
            <Award className="mr-2 h-4 w-4" />
            Khen thưởng ({rewards.length})
          </TabsTrigger>
          <TabsTrigger value="disciplines">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Kỷ luật ({disciplines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <Button onClick={() => handleAdd('KHEN_THUONG')} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khen thưởng
          </Button>

          {rewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Chưa có khen thưởng</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedRewards).map(([category, items]) => {
                const categoryInfo = awardCategories.find(c => c.value === category);
                const Icon = categoryInfo?.icon || Award;
                return (
                  <Card key={category}>
                    <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${categoryInfo?.color || 'text-green-600'}`} />
                        <CardTitle className="text-base">{category}</CardTitle>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.year}
                                </Badge>
                                {item.awardedBy && (
                                  <span className="text-sm text-muted-foreground">
                                    {item.awardedBy}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">{item.description}</p>
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
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="disciplines" className="space-y-4">
          <Button onClick={() => handleAdd('KY_LUAT')} variant="destructive" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Thêm kỷ luật
          </Button>

          {disciplines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Không có kỷ luật</p>
                <p className="text-sm text-green-600 mt-2">✓ Hồ sơ sạch</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {disciplines.map((item) => (
                <Card key={item.id} className="border-l-4 border-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{item.category}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.year}
                          </Badge>
                          {item.awardedBy && (
                            <span className="text-sm text-muted-foreground">
                              {item.awardedBy}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-sm">{item.description}</CardTitle>
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
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
