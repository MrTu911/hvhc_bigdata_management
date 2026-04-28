'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';
import { Plus, Edit, Trash2, Search, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface HeSoMonHoc {
  id: string;
  maMon: string;
  tenMon: string;
  heSoChuyenCan: number;
  heSoGiuaKy: number;
  heSoBaiTap: number;
  heSoThi: number;
  soTinChi: number;
  loaiMon?: string;
  khoa?: string;
  moTa?: string;
}

export default function HeSoMonHocPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [heSoList, setHeSoList] = useState<HeSoMonHoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HeSoMonHoc | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKhoa, setFilterKhoa] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    maMon: '',
    tenMon: '',
    heSoChuyenCan: 0.1,
    heSoGiuaKy: 0.2,
    heSoBaiTap: 0.2,
    heSoThi: 0.5,
    soTinChi: 3,
    loaiMon: 'Đại cương',
    khoa: '',
    moTa: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const userRole = (session?.user as any)?.role;
    if (userRole !== 'QUAN_TRI_HE_THONG' && userRole !== 'CHI_HUY_KHOA') {
      router.push('/dashboard');
      return;
    }

    fetchHeSoList();
  }, [status, session, router]);

  const fetchHeSoList = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/he-so');
      if (response.ok) {
        const data = await response.json();
        setHeSoList(data);
      } else {
        toast.error('Không thể tải danh sách hệ số môn học');
      }
    } catch (error) {
      console.error('Error fetching he so:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: HeSoMonHoc) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        maMon: item.maMon,
        tenMon: item.tenMon,
        heSoChuyenCan: item.heSoChuyenCan,
        heSoGiuaKy: item.heSoGiuaKy,
        heSoBaiTap: item.heSoBaiTap,
        heSoThi: item.heSoThi,
        soTinChi: item.soTinChi,
        loaiMon: item.loaiMon || '',
        khoa: item.khoa || '',
        moTa: item.moTa || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        maMon: '',
        tenMon: '',
        heSoChuyenCan: 0.1,
        heSoGiuaKy: 0.2,
        heSoBaiTap: 0.2,
        heSoThi: 0.5,
        soTinChi: 3,
        loaiMon: 'Đại cương',
        khoa: '',
        moTa: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validate sum of coefficients
    const sum = formData.heSoChuyenCan + formData.heSoGiuaKy + formData.heSoBaiTap + formData.heSoThi;
    if (Math.abs(sum - 1.0) > 0.01) {
      toast.error('Tổng hệ số phải bằng 1.0 (hiện tại: ' + sum.toFixed(2) + ')');
      return;
    }

    try {
      const url = '/api/student/he-so';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingItem ? 'Cập nhật hệ số thành công' : 'Tạo hệ số môn học thành công');
        setDialogOpen(false);
        fetchHeSoList();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || errorData.message || 'Không thể lưu hệ số môn học', {
          description: response.status >= 500 ? `Lỗi hệ thống (${response.status})` : `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Lỗi kết nối', { description: 'Không thể lưu hệ số môn học.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa hệ số môn học này?')) return;

    try {
      const response = await fetch(`/api/student/he-so?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa hệ số môn học');
        fetchHeSoList();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || errorData.message || 'Không thể xóa hệ số môn học', {
          description: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Lỗi kết nối', { description: 'Không thể xóa hệ số môn học.' });
    }
  };

  const filteredList = heSoList.filter(item => {
    const matchSearch = item.maMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.tenMon.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKhoa = filterKhoa === 'all' || item.khoa === filterKhoa;
    return matchSearch && matchKhoa;
  });

  const uniqueKhoa = Array.from(new Set(heSoList.map(item => item.khoa).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Điều chỉnh hệ số điểm môn học</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý trọng số điểm cho từng môn học (Tổng hệ số = 1.0)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm môn học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Cập nhật hệ số môn học' : 'Thêm hệ số môn học mới'}
              </DialogTitle>
              <DialogDescription>
                Tổng hệ số phải bằng 1.0. Ví dụ: 0.1 + 0.2 + 0.2 + 0.5 = 1.0
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã môn *</Label>
                <Input
                  value={formData.maMon}
                  onChange={(e) => setFormData({ ...formData, maMon: e.target.value })}
                  placeholder="VD: MATH101"
                  disabled={!!editingItem}
                />
              </div>
              <div>
                <Label>Tên môn *</Label>
                <Input
                  value={formData.tenMon}
                  onChange={(e) => setFormData({ ...formData, tenMon: e.target.value })}
                  placeholder="VD: Toán cao cấp"
                />
              </div>

              <div>
                <Label>Hệ số chuyên cần</Label>
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
                <Label>Hệ số giữa kỳ</Label>
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
                <Label>Hệ số bài tập</Label>
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
                <Label>Hệ số thi cuối kỳ</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.heSoThi}
                  onChange={(e) => setFormData({ ...formData, heSoThi: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label>Số tín chỉ</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.soTinChi}
                  onChange={(e) => setFormData({ ...formData, soTinChi: parseInt(e.target.value) || 3 })}
                />
              </div>

              <div>
                <Label>Loại môn</Label>
                <Select value={formData.loaiMon} onValueChange={(value) => setFormData({ ...formData, loaiMon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đại cương">Đại cương</SelectItem>
                    <SelectItem value="Cơ sở">Cơ sở</SelectItem>
                    <SelectItem value="Chuyên ngành">Chuyên ngành</SelectItem>
                    <SelectItem value="Tự chọn">Tự chọn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Khoa phụ trách</Label>
                <Input
                  value={formData.khoa}
                  onChange={(e) => setFormData({ ...formData, khoa: e.target.value })}
                  placeholder="VD: Khoa Kỹ thuật"
                />
              </div>

              <div className="col-span-2">
                <Label>Mô tả</Label>
                <Input
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  placeholder="Mô tả ngắn về môn học"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Tổng hệ số:</span>
                <span className={
                  Math.abs((formData.heSoChuyenCan + formData.heSoGiuaKy + formData.heSoBaiTap + formData.heSoThi) - 1.0) <= 0.01
                    ? 'text-green-600 font-bold'
                    : 'text-red-600 font-bold'
                }>
                  {(formData.heSoChuyenCan + formData.heSoGiuaKy + formData.heSoBaiTap + formData.heSoThi).toFixed(2)}
                </span>
                <span className="text-muted-foreground">(Yêu cầu: 1.00)</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo mã môn hoặc tên môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterKhoa} onValueChange={setFilterKhoa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo khoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {uniqueKhoa.map(khoa => (
                  <SelectItem key={khoa} value={khoa || ''}>{khoa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hệ số môn học ({filteredList.length})</CardTitle>
          <CardDescription>Quản lý trọng số điểm cho từng môn</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy môn học nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã môn</TableHead>
                  <TableHead>Tên môn</TableHead>
                  <TableHead className="text-center">CC</TableHead>
                  <TableHead className="text-center">GK</TableHead>
                  <TableHead className="text-center">BT</TableHead>
                  <TableHead className="text-center">Thi</TableHead>
                  <TableHead className="text-center">Tín chỉ</TableHead>
                  <TableHead>Loại môn</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.maMon}</TableCell>
                    <TableCell>{item.tenMon}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{(item.heSoChuyenCan * 100).toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{(item.heSoGiuaKy * 100).toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{(item.heSoBaiTap * 100).toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{(item.heSoThi * 100).toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">{item.soTinChi}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.loaiMon || '-'}</Badge>
                    </TableCell>
                    <TableCell>{item.khoa || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
