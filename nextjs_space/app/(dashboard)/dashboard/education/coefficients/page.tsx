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
import { Plus, Pencil, Trash2, Search, Calculator, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Interface khớp với DB schema (maMon, tenMon, heSoChuyenCan, etc.)
interface Coefficient {
  id: string;
  maMon: string;
  tenMon: string;
  soTinChi: number;
  heSoChuyenCan: number;
  heSoGiuaKy: number;
  heSoBaiTap: number;
  heSoThi: number;
  loaiMon?: string;
  khoa?: string;
  moTa?: string;
  createdAt: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  unit?: { name: string; code: string };
}

export default function CoefficientsPage() {
  const { t } = useLanguage();
  const [coefficients, setCoefficients] = useState<Coefficient[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoeff, setEditingCoeff] = useState<Coefficient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const defaultFormData = {
    maMon: '',
    tenMon: '',
    soTinChi: 3,
    heSoChuyenCan: 0.1,
    heSoGiuaKy: 0.2,
    heSoBaiTap: 0.2,
    heSoThi: 0.5,
    khoa: '',
    moTa: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const totalCoeff = formData.heSoChuyenCan + formData.heSoGiuaKy + formData.heSoBaiTap + formData.heSoThi;
  const isValidTotal = Math.abs(totalCoeff - 1) < 0.001;

  const fetchCoefficients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await fetch(`/api/education/coefficients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCoefficients(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/education/subjects?limit=500');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchCoefficients();
    fetchSubjects();
  }, [fetchCoefficients]);

  const handleSubjectSelect = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
      setFormData({
        ...formData,
        maMon: subject.code,
        tenMon: subject.name,
        soTinChi: subject.credits,
        khoa: subject.unit?.name || '',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.maMon || !formData.tenMon) {
      toast.error('Vui lòng chọn môn học');
      return;
    }

    if (!isValidTotal) {
      toast.error('Tổng hệ số phải bằng 1.0');
      return;
    }

    try {
      const url = '/api/education/coefficients';
      const method = editingCoeff ? 'PUT' : 'POST';
      const body = editingCoeff ? { id: editingCoeff.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCoeff ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setIsDialogOpen(false);
        resetForm();
        fetchCoefficients();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;

    try {
      const res = await fetch(`/api/education/coefficients?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchCoefficients();
      } else {
        toast.error('Không thể xóa');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleEdit = (coeff: Coefficient) => {
    setEditingCoeff(coeff);
    setFormData({
      maMon: coeff.maMon,
      tenMon: coeff.tenMon,
      soTinChi: coeff.soTinChi,
      heSoChuyenCan: coeff.heSoChuyenCan,
      heSoGiuaKy: coeff.heSoGiuaKy,
      heSoBaiTap: coeff.heSoBaiTap,
      heSoThi: coeff.heSoThi,
      khoa: coeff.khoa || '',
      moTa: coeff.moTa || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoeff(null);
    setFormData(defaultFormData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hệ số môn học</h1>
          <p className="text-muted-foreground mt-1">Quản lý hệ số điểm của các môn học</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm hệ số
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCoeff ? 'Cập nhật hệ số' : 'Thêm hệ số mới'}</DialogTitle>
              <DialogDescription>Cấu hình hệ số điểm cho môn học</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Chọn môn học từ danh sách */}
              <div>
                <Label>Chọn môn học *</Label>
                <Select onValueChange={handleSubjectSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn học từ danh sách" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name} ({subject.credits} TC)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã môn học</Label>
                  <Input value={formData.maMon} disabled />
                </div>
                <div>
                  <Label>Số tín chỉ</Label>
                  <Input type="number" value={formData.soTinChi} disabled />
                </div>
              </div>

              <div>
                <Label>Tên môn học</Label>
                <Input value={formData.tenMon} disabled />
              </div>

              <div>
                <Label>Khoa/Phòng</Label>
                <Input value={formData.khoa} disabled />
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Hệ số điểm</Label>
                  <div className={`flex items-center gap-1 ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                    {isValidTotal ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-sm font-medium">Tổng: {totalCoeff.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Chuyên cần</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.heSoChuyenCan}
                      onChange={(e) => setFormData({ ...formData, heSoChuyenCan: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Giữa kỳ</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.heSoGiuaKy}
                      onChange={(e) => setFormData({ ...formData, heSoGiuaKy: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bài tập</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.heSoBaiTap}
                      onChange={(e) => setFormData({ ...formData, heSoBaiTap: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Thi cuối</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.heSoThi}
                      onChange={(e) => setFormData({ ...formData, heSoThi: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Ghi chú</Label>
                <Input
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  placeholder="Ghi chú thêm..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={!isValidTotal}>
                {editingCoeff ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
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
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng hệ số</p>
                <p className="text-2xl font-bold">{coefficients.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hợp lệ</p>
                <p className="text-2xl font-bold text-green-600">
                  {coefficients.filter(c => 
                    Math.abs((c.heSoChuyenCan + c.heSoGiuaKy + c.heSoBaiTap + c.heSoThi) - 1) < 0.001
                  ).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cần kiểm tra</p>
                <p className="text-2xl font-bold text-amber-600">
                  {coefficients.filter(c => 
                    Math.abs((c.heSoChuyenCan + c.heSoGiuaKy + c.heSoBaiTap + c.heSoThi) - 1) >= 0.001
                  ).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hệ số điểm</CardTitle>
          <CardDescription>Tổng hệ số các cột điểm phải bằng 1.0</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : coefficients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có dữ liệu hệ số môn học
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn học</TableHead>
                  <TableHead>Khoa/Bộ môn</TableHead>
                  <TableHead className="text-center">CC</TableHead>
                  <TableHead className="text-center">GK</TableHead>
                  <TableHead className="text-center">BT</TableHead>
                  <TableHead className="text-center">Thi</TableHead>
                  <TableHead className="text-center">Tổng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coefficients.map((coeff) => {
                  const total = coeff.heSoChuyenCan + coeff.heSoGiuaKy + coeff.heSoBaiTap + coeff.heSoThi;
                  const isValid = Math.abs(total - 1) < 0.001;
                  return (
                    <TableRow key={coeff.id}>
                      <TableCell className="font-mono font-medium">{coeff.maMon}</TableCell>
                      <TableCell>{coeff.tenMon}</TableCell>
                      <TableCell><Badge variant="outline">{coeff.khoa || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-center">{(coeff.heSoChuyenCan * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-center">{(coeff.heSoGiuaKy * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-center">{(coeff.heSoBaiTap * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-center">{(coeff.heSoThi * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isValid ? 'default' : 'destructive'}>
                          {(total * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coeff)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coeff.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
