'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, FileText, Video, Image, Music, Download, Eye, Upload, Book, Presentation, Code } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LearningMaterial {
  id: string;
  code: string;
  title: string;
  description?: string;
  subjectCode?: string;
  subjectName?: string;
  materialType: string;
  format?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  unitId?: string;
  chapter?: string;
  topic?: string;
  tags: string[];
  viewCount: number;
  downloadCount: number;
  accessLevel: string;
  unit?: { code: string; name: string };
}

interface Unit {
  id: string;
  code: string;
  name: string;
}

const materialTypes = [
  { value: 'DOCUMENT', label: 'Tài liệu', icon: FileText },
  { value: 'PRESENTATION', label: 'Slide', icon: Presentation },
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'AUDIO', label: 'Audio', icon: Music },
  { value: 'IMAGE', label: 'Hình ảnh', icon: Image },
  { value: 'CODE', label: 'Mã nguồn', icon: Code },
  { value: 'OTHER', label: 'Khác', icon: Book }
];

const accessLevels = [
  { value: 'PUBLIC', label: 'Công khai' },
  { value: 'INTERNAL', label: 'Nội bộ' },
  { value: 'RESTRICTED', label: 'Hạn chế' },
  { value: 'PRIVATE', label: 'Riêng tư' }
];

const accessColors: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-800',
  INTERNAL: 'bg-blue-100 text-blue-800',
  RESTRICTED: 'bg-yellow-100 text-yellow-800',
  PRIVATE: 'bg-red-100 text-red-800'
};

export default function LearningMaterialsPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<LearningMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [typeStats, setTypeStats] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    subjectCode: '',
    subjectName: '',
    materialType: 'DOCUMENT',
    format: '',
    fileUrl: '',
    fileName: '',
    duration: 0,
    unitId: '',
    chapter: '',
    topic: '',
    tags: '',
    accessLevel: 'INTERNAL'
  });

  useEffect(() => {
    fetchMaterials();
    fetchUnits();
  }, [filterType]);

  const fetchMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('materialType', filterType);

      const res = await fetch(`/api/education/learning-materials?${params}`);
      const data = await res.json();
      if (data.data) setMaterials(data.data);
      if (data.stats?.typeStats) {
        const stats = data.stats.typeStats.map((s: any) => ({
          type: materialTypes.find(t => t.value === s.materialType)?.label || s.materialType,
          count: s._count.id
        }));
        setTypeStats(stats);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      if (data.data) setUnits(data.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMaterial ? 'PUT' : 'POST';
      const body = editingMaterial ? { id: editingMaterial.id, ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) } : { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) };

      const res = await fetch('/api/education/learning-materials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDialogOpen(false);
        resetForm();
        fetchMaterials();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu học liệu', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học liệu này?')) return;
    try {
      const res = await fetch(`/api/education/learning-materials?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        fetchMaterials();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const openEditDialog = (material: LearningMaterial) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      title: material.title,
      description: material.description || '',
      subjectCode: material.subjectCode || '',
      subjectName: material.subjectName || '',
      materialType: material.materialType,
      format: material.format || '',
      fileUrl: material.fileUrl || '',
      fileName: material.fileName || '',
      duration: material.duration || 0,
      unitId: material.unitId || '',
      chapter: material.chapter || '',
      topic: material.topic || '',
      tags: material.tags.join(', '),
      accessLevel: material.accessLevel
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      subjectCode: '',
      subjectName: '',
      materialType: 'DOCUMENT',
      format: '',
      fileUrl: '',
      fileName: '',
      duration: 0,
      unitId: '',
      chapter: '',
      topic: '',
      tags: '',
      accessLevel: 'INTERNAL'
    });
  };

  const filteredMaterials = materials.filter(m =>
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    const TypeIcon = materialTypes.find(t => t.value === type)?.icon || FileText;
    return <TypeIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Stats
  const totalViews = materials.reduce((sum, m) => sum + m.viewCount, 0);
  const totalDownloads = materials.reduce((sum, m) => sum + m.downloadCount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Học liệu</h1>
          <p className="text-muted-foreground">Tài liệu, bài giảng, video học tập</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Upload className="mr-2 h-4 w-4" /> Tải lên học liệu</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Chỉnh sửa' : 'Thêm'} học liệu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tiêu đề *</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Loại học liệu</Label>
                  <Select value={formData.materialType} onValueChange={(v) => setFormData({ ...formData, materialType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quyền truy cập</Label>
                  <Select value={formData.accessLevel} onValueChange={(v) => setFormData({ ...formData, accessLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accessLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mã môn</Label>
                  <Input value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tên môn</Label>
                  <Input value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Chương</Label>
                  <Input value={formData.chapter} onChange={(e) => setFormData({ ...formData, chapter: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Chủ đề</Label>
                  <Input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Đơn vị</Label>
                  <Select value={formData.unitId} onValueChange={(v) => setFormData({ ...formData, unitId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Định dạng (pdf, docx...)</Label>
                  <Input value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>URL File</Label>
                  <Input value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Tags (cách nhau bởi dấu phẩy)</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="tin học, lập trình, cơ bản" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                <Button type="submit">{editingMaterial ? 'Cập nhật' : 'Lưu'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng học liệu</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt xem</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt tải</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(materials.map(m => m.subjectCode).filter(Boolean)).size}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Phân bố theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            {typeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={80} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tìm kiếm..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {materialTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {loading ? (
                <p className="col-span-2 text-center py-8">Đang tải...</p>
              ) : filteredMaterials.length === 0 ? (
                <p className="col-span-2 text-center py-8">Không có học liệu nào</p>
              ) : (
                filteredMaterials.map((material) => (
                  <Card key={material.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getIcon(material.materialType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{material.title}</span>
                            <Badge className={accessColors[material.accessLevel]} variant="secondary">
                              {accessLevels.find(l => l.value === material.accessLevel)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{material.subjectName || material.code}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {material.viewCount}</span>
                            <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {material.downloadCount}</span>
                            <span>{formatFileSize(material.fileSize)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(material)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
