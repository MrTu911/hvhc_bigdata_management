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
import { AlertTriangle, Plus, Search, Filter, FileText, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface DisciplineRecord {
  id: string;
  userId: string;
  userName: string;
  type: string;
  level: string;
  reason: string;
  decisionNumber: string;
  decisionDate: string;
  effectiveDate: string;
  endDate: string | null;
  issuedBy: string;
  status: string;
}

export default function DisciplinePage() {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: '',
    level: '',
    reason: '',
    decisionNumber: '',
    decisionDate: '',
    effectiveDate: '',
    issuedBy: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [typeFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'DISCIPLINE',
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

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/policy/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, category: 'DISCIPLINE' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thêm hình thức kỉ luật thành công');
        setDialogOpen(false);
        fetchRecords();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'KHỂN TRÁCH': 'bg-yellow-100 text-yellow-800',
      'CẢNH CÁO': 'bg-orange-100 text-orange-800',
      'HẠ BẬC LƯƠNG': 'bg-red-100 text-red-800',
      'GIÁNG CHỨC': 'bg-red-200 text-red-900',
      'BUỘC THÔI VIỆC': 'bg-red-300 text-red-900',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  // Demo data
  const demoRecords: DisciplineRecord[] = [
    {
      id: '1',
      userId: 'u1',
      userName: 'Nguyễn Văn A',
      type: 'VI PHẠM NỘI QUY',
      level: 'KHỂN TRÁCH',
      reason: 'Vi phạm quy định về giờ làm việc',
      decisionNumber: 'QĐ-KL-2024-001',
      decisionDate: '2024-03-15',
      effectiveDate: '2024-03-20',
      endDate: '2024-09-20',
      issuedBy: 'Giám đốc Học viện',
      status: 'ACTIVE',
    },
    {
      id: '2',
      userId: 'u2',
      userName: 'Trần Thị B',
      type: 'VI PHẠM QUY CHẾ',
      level: 'CẢNH CÁO',
      reason: 'Vi phạm quy chế thi cử',
      decisionNumber: 'QĐ-KL-2024-002',
      decisionDate: '2024-05-10',
      effectiveDate: '2024-05-15',
      endDate: null,
      issuedBy: 'Hiệu trưởng',
      status: 'ACTIVE',
    },
  ];

  const displayRecords = records.length > 0 ? records : demoRecords;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Quản lý Kỉ luật
          </h1>
          <p className="text-gray-500">Theo dõi và quản lý các hình thức kỉ luật</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Thêm mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm hình thức kỉ luật</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Cán bộ</Label>
                <Input placeholder="Chọn cán bộ" value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})} />
              </div>
              <div>
                <Label>Loại vi phạm</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VI_PHAM_NOI_QUY">Vi phạm nội quy</SelectItem>
                    <SelectItem value="VI_PHAM_QUY_CHE">Vi phạm quy chế</SelectItem>
                    <SelectItem value="VI_PHAM_PHAP_LUAT">Vi phạm pháp luật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mức kỉ luật</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({...formData, level: v})}>
                  <SelectTrigger><SelectValue placeholder="Chọn mức" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KHIEN_TRACH">Khiển trách</SelectItem>
                    <SelectItem value="CANH_CAO">Cảnh cáo</SelectItem>
                    <SelectItem value="HA_BAC_LUONG">Hạ bậc lương</SelectItem>
                    <SelectItem value="GIANG_CHUC">Giáng chức</SelectItem>
                    <SelectItem value="BUOC_THOI_VIEC">Buộc thôi việc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số quyết định</Label>
                <Input placeholder="QĐ-KL-2024-XXX" value={formData.decisionNumber} onChange={(e) => setFormData({...formData, decisionNumber: e.target.value})} />
              </div>
              <div>
                <Label>Ngày quyết định</Label>
                <Input type="date" value={formData.decisionDate} onChange={(e) => setFormData({...formData, decisionDate: e.target.value})} />
              </div>
              <div>
                <Label>Ngày hiệu lực</Label>
                <Input type="date" value={formData.effectiveDate} onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Lý do kỉ luật</Label>
                <Textarea placeholder="Nhập lý do..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit}>Lưu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{displayRecords.length}</div>
            <p className="text-sm text-gray-500">Tổng kỉ luật</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{displayRecords.filter(r => r.level === 'KHỂN TRÁCH').length}</div>
            <p className="text-sm text-gray-500">Khiển trách</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{displayRecords.filter(r => r.level === 'CẢNH CÁO').length}</div>
            <p className="text-sm text-gray-500">Cảnh cáo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{displayRecords.filter(r => r.status === 'ENDED').length}</div>
            <p className="text-sm text-gray-500">Đã hết hạn</p>
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
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Loại vi phạm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="VI_PHAM_NOI_QUY">Vi phạm nội quy</SelectItem>
                <SelectItem value="VI_PHAM_QUY_CHE">Vi phạm quy chế</SelectItem>
                <SelectItem value="VI_PHAM_PHAP_LUAT">Vi phạm pháp luật</SelectItem>
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
                <TableHead>Loại vi phạm</TableHead>
                <TableHead>Mức kỉ luật</TableHead>
                <TableHead>Số QĐ</TableHead>
                <TableHead>Ngày hiệu lực</TableHead>
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
                  <TableCell>{record.type}</TableCell>
                  <TableCell>
                    <Badge className={getLevelBadge(record.level)}>{record.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      {record.decisionNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {record.effectiveDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'ACTIVE' ? 'destructive' : 'secondary'}>
                      {record.status === 'ACTIVE' ? 'Còn hiệu lực' : 'Hết hạn'}
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
