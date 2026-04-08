'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { Plus, Pencil, Trash2, Search, BookOpen, Filter, RefreshCw, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  courseType: string;
  unitId: string;
  unit?: { id: string; name: string; code: string };
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface Unit {
  id: string;
  name: string;
  code: string;
  unitType: string;
}

export default function SubjectManagementPage() {
  const { t } = useLanguage();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    courseType: 'REQUIRED',
    unitId: '',
    description: '',
  });

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterUnit) params.append('unitId', filterUnit);
      if (filterType) params.append('courseType', filterType);
      
      const res = await fetch(`/api/education/subjects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Lỗi khi tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterUnit, filterType]);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units?type=FACULTY,DEPARTMENT');
      if (res.ok) {
        const data = await res.json();
        setUnits(data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchUnits();
  }, [fetchSubjects]);

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.unitId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const url = '/api/education/subjects';
      const method = editingSubject ? 'PUT' : 'POST';
      const body = editingSubject ? { id: editingSubject.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingSubject ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setIsDialogOpen(false);
        resetForm();
        fetchSubjects();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;

    try {
      const res = await fetch(`/api/education/subjects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchSubjects();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Không thể xóa');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      courseType: subject.courseType,
      unitId: subject.unitId,
      description: subject.description || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      credits: 3,
      courseType: 'REQUIRED',
      unitId: '',
      description: '',
    });
  };

  const courseTypes = [
    { value: 'REQUIRED', label: 'Bắt buộc' },
    { value: 'ELECTIVE', label: 'Tự chọn' },
    { value: 'GENERAL', label: 'Đại cương' },
    { value: 'SPECIALIZED', label: 'Chuyên ngành' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý môn học</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh mục môn học theo đơn vị</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm môn học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Cập nhật môn học' : 'Thêm môn học mới'}</DialogTitle>
              <DialogDescription>Nhập thông tin môn học</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã môn học *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VD: CNTT101"
                  />
                </div>
                <div>
                  <Label>Số tín chỉ *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
              <div>
                <Label>Tên môn học *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Lập trình cơ bản"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Khoa/Phòng *</Label>
                  <Select
                    value={formData.unitId}
                    onValueChange={(v) => setFormData({ ...formData, unitId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Loại môn</Label>
                  <Select
                    value={formData.courseType}
                    onValueChange={(v) => setFormData({ ...formData, courseType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả môn học..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit}>{editingSubject ? 'Cập nhật' : 'Thêm mới'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã hoặc tên môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Khoa/Phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Đơn vị</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Loại môn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {courseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterUnit(''); setFilterType(''); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng môn học</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bắt buộc</p>
                <p className="text-2xl font-bold">{subjects.filter(s => s.courseType === 'REQUIRED').length}</p>
              </div>
              <Badge variant="destructive">Bắt buộc</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tự chọn</p>
                <p className="text-2xl font-bold">{subjects.filter(s => s.courseType === 'ELECTIVE').length}</p>
              </div>
              <Badge variant="secondary">Tự chọn</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng tín chỉ</p>
                <p className="text-2xl font-bold">{subjects.reduce((sum, s) => sum + (s.credits || 0), 0)}</p>
              </div>
              <Badge>TC</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách môn học</CardTitle>
          <CardDescription>Quản lý thông tin môn học theo đơn vị</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có dữ liệu môn học
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Khoa/Phòng</TableHead>
                  <TableHead className="text-center">Tín chỉ</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.unit?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>{subject.credits}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.courseType === 'REQUIRED' ? 'destructive' : 'secondary'}>
                        {courseTypes.find(t => t.value === subject.courseType)?.label || subject.courseType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
