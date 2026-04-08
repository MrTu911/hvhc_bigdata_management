/**
 * Rewards List Page with CRUD
 * Danh sách Khen thưởng với đầy đủ chức năng CRUD
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Trophy,
  Medal,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Building2,
  Calendar,
  Filter,
  Download,
  User
} from 'lucide-react';

// Reward types as per requirements
const REWARD_TYPES = [
  { value: 'BANG_KHEN', label: 'Bằng khen', color: 'bg-amber-100 text-amber-800' },
  { value: 'GIAY_KHEN', label: 'Giấy khen', color: 'bg-blue-100 text-blue-800' },
  { value: 'CHIEN_SI_THI_DUA', label: 'Chiến sĩ thi đua', color: 'bg-red-100 text-red-800' },
  { value: 'CHIEN_SI_TIEN_TIEN', label: 'Chiến sĩ tiên tiến', color: 'bg-green-100 text-green-800' },
];

const REWARD_LEVELS = [
  { value: 'NATIONAL', label: 'Cấp Nhà nước' },
  { value: 'MINISTRY', label: 'Cấp Bộ' },
  { value: 'UNIT', label: 'Cấp Học viện' },
  { value: 'DEPARTMENT', label: 'Cấp Khoa/Phòng' },
];

interface RewardRecord {
  id: string;
  userId: string;
  title: string;
  reason: string;
  level: string;
  decisionNumber: string | null;
  decisionDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  signerName: string | null;
  signerPosition: string | null;
  issuingUnit: string | null;
  status: string;
  workflowStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    rank: string | null;
    position: string | null;
    unitRelation: { id: string; name: string; code: string } | null;
  };
}

interface Unit {
  id: string;
  name: string;
  code: string;
  level: number;
}

export default function RewardsListPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [records, setRecords] = useState<RewardRecord[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedRewardType, setSelectedRewardType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RewardRecord | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    reason: '',
    level: '',
    decisionNumber: '',
    decisionDate: '',
    signerName: '',
    signerPosition: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [search, selectedRewardType, selectedLevel, selectedUnit, selectedYear, page]);

  async function fetchUnits() {
    try {
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  }

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        recordType: 'REWARD',
        ...(search && { search }),
        ...(selectedRewardType !== 'all' && { rewardType: selectedRewardType }),
        ...(selectedLevel !== 'all' && { level: selectedLevel }),
        ...(selectedUnit !== 'all' && { unitId: selectedUnit }),
        ...(selectedYear && { year: selectedYear }),
      });

      const res = await fetch(`/api/policy-records?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        // Demo data
        setRecords([
          {
            id: '1',
            userId: 'u1',
            title: 'Chiến sĩ thi đua cơ sở',
            reason: 'Hoàn thành xuất sắc nhiệm vụ năm 2025',
            level: 'UNIT',
            decisionNumber: 'QĐ-125/HVHC',
            decisionDate: '2026-01-15',
            effectiveDate: '2026-01-15',
            expiryDate: null,
            signerName: 'Nguyễn Văn A',
            signerPosition: 'Giám đốc',
            issuingUnit: 'Học viện Hậu cần',
            status: 'ACTIVE',
            workflowStatus: 'APPROVED',
            createdAt: '2026-01-15T00:00:00Z',
            user: {
              id: 'u1',
              name: 'Trần Văn B',
              rank: 'Thiếu tá',
              position: 'Giảng viên',
              unitRelation: { id: 'unit1', name: 'Khoa CNTT', code: 'CNTT' }
            }
          },
          {
            id: '2',
            userId: 'u2',
            title: 'Bằng khen Bộ Quốc phòng',
            reason: 'Có thành tích xuất sắc trong NCKH',
            level: 'MINISTRY',
            decisionNumber: 'QĐ-456/BQP',
            decisionDate: '2026-02-01',
            effectiveDate: '2026-02-01',
            expiryDate: null,
            signerName: 'Lê Văn C',
            signerPosition: 'Bộ trưởng',
            issuingUnit: 'Bộ Quốc phòng',
            status: 'ACTIVE',
            workflowStatus: 'APPROVED',
            createdAt: '2026-02-01T00:00:00Z',
            user: {
              id: 'u2',
              name: 'Phạm Thị D',
              rank: 'Trung tá',
              position: 'Giảng viên chính',
              unitRelation: { id: 'unit2', name: 'Khoa KTĐT', code: 'KTDT' }
            }
          },
        ]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Không thể tải danh sách khen thưởng');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRewardType, selectedLevel, selectedUnit, selectedYear, page]);

  const getRewardTypeBadge = (title: string) => {
    const type = REWARD_TYPES.find(t => title.toLowerCase().includes(t.label.toLowerCase()));
    return type ? (
      <Badge className={`${type.color} border-0`}>{type.label}</Badge>
    ) : (
      <Badge variant="outline">{title}</Badge>
    );
  };

  const getLevelBadge = (level: string) => {
    const found = REWARD_LEVELS.find(l => l.value === level);
    const colorMap: Record<string, string> = {
      'NATIONAL': 'bg-yellow-100 text-yellow-800',
      'MINISTRY': 'bg-red-100 text-red-800',
      'UNIT': 'bg-blue-100 text-blue-800',
      'DEPARTMENT': 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={`${colorMap[level] || 'bg-gray-100 text-gray-800'} border-0`}>
        {found?.label || level}
      </Badge>
    );
  };

  const handleView = (record: RewardRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleEdit = (record: RewardRecord) => {
    setSelectedRecord(record);
    setEditForm({
      title: record.title,
      reason: record.reason,
      level: record.level,
      decisionNumber: record.decisionNumber || '',
      decisionDate: record.decisionDate?.split('T')[0] || '',
      signerName: record.signerName || '',
      signerPosition: record.signerPosition || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (record: RewardRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!selectedRecord) return;
    try {
      const res = await fetch(`/api/policy-records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (res.ok) {
        toast.success('Cập nhật thành công');
        setEditDialogOpen(false);
        fetchRecords();
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;
    try {
      const res = await fetch(`/api/policy-records/${selectedRecord.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast.success('Xóa thành công');
        setDeleteDialogOpen(false);
        fetchRecords();
      } else {
        toast.error('Xóa thất bại');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const exportToCSV = () => {
    const headers = ['STT', 'Họ tên', 'Cấp bậc', 'Chức vụ', 'Đơn vị', 'Hình thức', 'Cấp khen', 'Số QĐ', 'Ngày QĐ', 'Lý do'];
    const rows = records.map((r, idx) => [
      idx + 1,
      r.user?.name || 'N/A',
      r.user?.rank || '',
      r.user?.position || '',
      r.user?.unitRelation?.name || '',
      r.title,
      REWARD_LEVELS.find(l => l.value === r.level)?.label || r.level,
      r.decisionNumber || '',
      r.decisionDate ? new Date(r.decisionDate).toLocaleDateString('vi-VN') : '',
      r.reason
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_khen_thuong_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/emulation')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <Medal className="h-7 w-7 text-white" />
              </div>
              Danh sách Khen thưởng
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý và tìm kiếm các quyết định khen thưởng
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
          <Button onClick={() => router.push('/dashboard/emulation/rewards/create')} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Thêm khen thưởng
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedRewardType} onValueChange={setSelectedRewardType}>
              <SelectTrigger>
                <SelectValue placeholder="Hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hình thức</SelectItem>
                {REWARD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Cấp khen thưởng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả cấp</SelectItem>
                {REWARD_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Không có dữ liệu khen thưởng</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Cán bộ</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead>Cấp</TableHead>
                  <TableHead>Số QĐ</TableHead>
                  <TableHead>Ngày QĐ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, idx) => (
                  <TableRow key={record.id}>
                    <TableCell>{(page - 1) * 20 + idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{record.user?.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {record.user?.rank} - {record.user?.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Building2 className="h-3 w-3 mr-1" />
                        {record.user?.unitRelation?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getRewardTypeBadge(record.title)}</TableCell>
                    <TableCell>{getLevelBadge(record.level)}</TableCell>
                    <TableCell>{record.decisionNumber || '-'}</TableCell>
                    <TableCell>
                      {record.decisionDate
                        ? new Date(record.decisionDate).toLocaleDateString('vi-VN')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(record)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(record)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Trước
              </Button>
              <span className="px-4 py-2 text-sm">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Chi tiết Khen thưởng
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cán bộ</Label>
                  <p className="font-medium">{selectedRecord.user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.user?.rank} - {selectedRecord.user?.position}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Đơn vị</Label>
                  <p className="font-medium">{selectedRecord.user?.unitRelation?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Hình thức</Label>
                  <div className="mt-1">{getRewardTypeBadge(selectedRecord.title)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cấp khen thưởng</Label>
                  <div className="mt-1">{getLevelBadge(selectedRecord.level)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Lý do khen thưởng</Label>
                <p className="mt-1">{selectedRecord.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Số quyết định</Label>
                  <p className="font-medium">{selectedRecord.decisionNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày quyết định</Label>
                  <p className="font-medium">
                    {selectedRecord.decisionDate
                      ? new Date(selectedRecord.decisionDate).toLocaleDateString('vi-VN')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Người ký</Label>
                  <p className="font-medium">{selectedRecord.signerName || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Chức vụ</Label>
                  <p className="font-medium">{selectedRecord.signerPosition || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Khen thưởng</DialogTitle>
            <DialogDescription>Cập nhật thông tin khen thưởng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hình thức khen thưởng</Label>
                <Select value={editForm.title} onValueChange={(v) => setEditForm({...editForm, title: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.label}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cấp khen thưởng</Label>
                <Select value={editForm.level} onValueChange={(v) => setEditForm({...editForm, level: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Lý do khen thưởng</Label>
              <Textarea
                value={editForm.reason}
                onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số quyết định</Label>
                <Input
                  value={editForm.decisionNumber}
                  onChange={(e) => setEditForm({...editForm, decisionNumber: e.target.value})}
                />
              </div>
              <div>
                <Label>Ngày quyết định</Label>
                <Input
                  type="date"
                  value={editForm.decisionDate}
                  onChange={(e) => setEditForm({...editForm, decisionDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Người ký</Label>
                <Input
                  value={editForm.signerName}
                  onChange={(e) => setEditForm({...editForm, signerName: e.target.value})}
                />
              </div>
              <div>
                <Label>Chức vụ người ký</Label>
                <Input
                  value={editForm.signerPosition}
                  onChange={(e) => setEditForm({...editForm, signerPosition: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Hủy</Button>
            <Button onClick={confirmEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khen thưởng này? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="py-4">
              <p><strong>Cán bộ:</strong> {selectedRecord.user?.name}</p>
              <p><strong>Hình thức:</strong> {selectedRecord.title}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
