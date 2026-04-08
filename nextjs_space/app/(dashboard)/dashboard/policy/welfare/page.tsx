'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Plus, Search, DollarSign, Calendar, User, Gift, Home, Baby, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface WelfareRecord {
  id: string;
  userId: string;
  userName: string;
  type: string;
  description: string;
  amount: number;
  decisionNumber: string;
  decisionDate: string;
  status: string;
}

export default function WelfarePage() {
  const [records, setRecords] = useState<WelfareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [typeFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'WELFARE',
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
      });
      const res = await fetch(`/api/policy/records?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'TRỢ CẤP ỐM': <Stethoscope className="h-4 w-4 text-red-500" />,
      'TRỢ CẤP THAI SẢN': <Baby className="h-4 w-4 text-pink-500" />,
      'HỖ TRỢ NHÀ Ở': <Home className="h-4 w-4 text-blue-500" />,
      'QUÀ TẾT': <Gift className="h-4 w-4 text-orange-500" />,
    };
    return icons[type] || <Heart className="h-4 w-4 text-gray-500" />;
  };

  // Demo data
  const demoRecords: WelfareRecord[] = [
    {
      id: '1',
      userId: 'u1',
      userName: 'Nguyễn Văn A',
      type: 'TRỢ CẤP ỐM',
      description: 'Trợ cấp ốm đau dài ngày (> 14 ngày)',
      amount: 5000000,
      decisionNumber: 'QĐ-TC-2024-001',
      decisionDate: '2024-06-15',
      status: 'APPROVED',
    },
    {
      id: '2',
      userId: 'u2',
      userName: 'Trần Thị B',
      type: 'TRỢ CẤP THAI SẢN',
      description: 'Chế độ thai sản - sinh con thứ nhất',
      amount: 15000000,
      decisionNumber: 'QĐ-TC-2024-002',
      decisionDate: '2024-07-01',
      status: 'APPROVED',
    },
    {
      id: '3',
      userId: 'u3',
      userName: 'Lê Văn C',
      type: 'HỖ TRỢ NHÀ Ở',
      description: 'Hỗ trợ tiền thuê nhà năm 2024',
      amount: 12000000,
      decisionNumber: 'QĐ-TC-2024-003',
      decisionDate: '2024-01-15',
      status: 'APPROVED',
    },
    {
      id: '4',
      userId: 'u4',
      userName: 'Phạm Thị D',
      type: 'QUÀ TẾT',
      description: 'Quà Tết Nguyên đán 2024',
      amount: 2000000,
      decisionNumber: 'QĐ-TC-2024-004',
      decisionDate: '2024-01-20',
      status: 'DISTRIBUTED',
    },
  ];

  const displayRecords = records.length > 0 ? records : demoRecords;
  const totalAmount = displayRecords.reduce((sum, r) => sum + r.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            Chế độ Chính sách
          </h1>
          <p className="text-gray-500">Quản lý các chế độ phúc lợi cho cán bộ</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Thêm mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm chế độ chính sách</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Cán bộ</Label>
                <Input placeholder="Chọn cán bộ" />
              </div>
              <div>
                <Label>Loại chế độ</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRO_CAP_OM">Trợ cấp ốm</SelectItem>
                    <SelectItem value="THAI_SAN">Thai sản</SelectItem>
                    <SelectItem value="HO_TRO_NHA">Hỗ trợ nhà ở</SelectItem>
                    <SelectItem value="QUA_TET">Quà Tết</SelectItem>
                    <SelectItem value="HIEU_HI">Hiếu hỉ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số tiền (VNĐ)</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div>
                <Label>Số quyết định</Label>
                <Input placeholder="QĐ-TC-2024-XXX" />
              </div>
              <div className="col-span-2">
                <Label>Mô tả</Label>
                <Textarea placeholder="Mô tả chi tiết..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button>Lưu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{displayRecords.length}</div>
            <p className="text-sm text-gray-500">Tổng số chế độ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
            <p className="text-sm text-gray-500">Tổng chi phí</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-pink-600">{displayRecords.filter(r => r.type.includes('THAI')).length}</div>
            <p className="text-sm text-gray-500">Thai sản</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{displayRecords.filter(r => r.type.includes('TẾT')).length}</div>
            <p className="text-sm text-gray-500">Quà Tết</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Tìm theo tên, mã cán bộ..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Loại chế độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="TRO_CAP_OM">Trợ cấp ốm</SelectItem>
                <SelectItem value="THAI_SAN">Thai sản</SelectItem>
                <SelectItem value="HO_TRO_NHA">Hỗ trợ nhà ở</SelectItem>
                <SelectItem value="QUA_TET">Quà Tết</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 font-medium">
                <TableHead>Cán bộ</TableHead>
                <TableHead>Loại chế độ</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Số QĐ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{record.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(record.type)}
                      <span>{record.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(record.amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {record.decisionNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {record.status === 'APPROVED' ? 'Đã duyệt' : 'Đã chi'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
