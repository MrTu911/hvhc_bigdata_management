'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, AlertTriangle, Plus, Search, Eye, Edit2, Trash2, 
  Medal, Star, FileText, Calendar, User, Award,
  ChevronLeft, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PolicyRecord {
  id: string;
  userId: string;
  recordType: 'REWARD' | 'DISCIPLINE';
  level: string;
  title: string;
  reason: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  signerName: string | null;
  signerPosition: string | null;
  issuingUnit: string | null;
  status: string;
  workflowStatus: string;
  user: {
    id: string;
    name: string;
    militaryId: string | null;
    rank: string | null;
    position: string | null;
    unitRelation: { id: string; name: string; code: string } | null;
  };
}

interface UserOption {
  id: string;
  name: string;
  militaryId: string | null;
  rank: string | null;
  unitRelation: { name: string } | null;
}

const LEVEL_OPTIONS = [
  { value: 'NATIONAL', label: 'Cấp Nhà nước', color: 'bg-gradient-to-r from-yellow-500 to-amber-500', icon: '🏆' },
  { value: 'MINISTRY', label: 'Cấp Bộ', color: 'bg-gradient-to-r from-red-500 to-rose-500', icon: '🎖️' },
  { value: 'UNIT', label: 'Cấp đơn vị', color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: '⭐' },
  { value: 'DEPARTMENT', label: 'Cấp phòng/khoa', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: '📜' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Còn hiệu lực', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'EXPIRED', label: 'Hết hạn', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'VOIDED', label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200' },
];

const DISCIPLINE_TYPES = [
  { value: 'KHIEN_TRACH', label: 'Khiển trách' },
  { value: 'CANH_CAO', label: 'Cảnh cáo' },
  { value: 'HA_BAC_LUONG', label: 'Hạ bậc lương' },
  { value: 'GIANG_CHUC', label: 'Giáng chức' },
  { value: 'CACH_CHUC', label: 'Cách chức' },
  { value: 'BUOC_THOI_VIEC', label: 'Buộc thôi việc' },
];

const REWARD_TITLES = [
  'Chiến sĩ thi đua cơ sở',
  'Chiến sĩ thi đua toàn quân',
  'Bằng khen Bộ Quốc phòng',
  'Bằng khen Học viện',
  'Giấy khen',
  'Huân chương Chiến công',
  'Huân chương Bảo vệ Tổ quốc',
  'Lao động tiên tiến',
];

export default function EmulationManagementPage() {
  const [activeTab, setActiveTab] = useState<'REWARD' | 'DISCIPLINE'>('REWARD');
  const [records, setRecords] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, rewards: 0, disciplines: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<PolicyRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PolicyRecord | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    recordType: 'REWARD' as 'REWARD' | 'DISCIPLINE',
    level: 'UNIT',
    title: '',
    reason: '',
    decisionNumber: '',
    decisionDate: '',
    effectiveDate: '',
    expiryDate: '',
    signerName: '',
    signerPosition: '',
    issuingUnit: 'Học viện Hậu cần',
    status: 'ACTIVE',
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        recordType: activeTab,
        ...(search && { search }),
        ...(levelFilter && levelFilter !== 'ALL' && { level: levelFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
      });

      const res = await fetch(`/api/policy-records?${params}`);
      const data = await res.json();

      setRecords(data.records || []);
      setStats(data.stats || { total: 0, rewards: 0, disciplines: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab, levelFilter, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, levelFilter, statusFilter]);

  const fetchUsers = async () => {
    if (users.length > 0) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/rbac/users?limit=500&status=ACTIVE');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openDialog = (mode: 'create' | 'edit' | 'view', record?: PolicyRecord) => {
    setDialogMode(mode);
    if (record) {
      setSelectedRecord(record);
      setFormData({
        userId: record.userId,
        recordType: record.recordType,
        level: record.level,
        title: record.title,
        reason: record.reason || '',
        decisionNumber: record.decisionNumber || '',
        decisionDate: record.decisionDate ? record.decisionDate.split('T')[0] : '',
        effectiveDate: record.effectiveDate ? record.effectiveDate.split('T')[0] : '',
        expiryDate: record.expiryDate ? record.expiryDate.split('T')[0] : '',
        signerName: record.signerName || '',
        signerPosition: record.signerPosition || '',
        issuingUnit: record.issuingUnit || '',
        status: record.status,
      });
    } else {
      setSelectedRecord(null);
      setFormData({
        userId: '',
        recordType: activeTab,
        level: 'UNIT',
        title: '',
        reason: '',
        decisionNumber: '',
        decisionDate: '',
        effectiveDate: '',
        expiryDate: '',
        signerName: '',
        signerPosition: '',
        issuingUnit: 'Học viện Hậu cần',
        status: 'ACTIVE',
      });
    }
    fetchUsers();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.userId || !formData.title) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const url = dialogMode === 'edit' && selectedRecord
        ? `/api/policy-records/${selectedRecord.id}`
        : '/api/policy-records';
      const method = dialogMode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(dialogMode === 'edit' ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setDialogOpen(false);
        fetchRecords();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await fetch(`/api/policy-records/${recordToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công!');
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
        fetchRecords();
      } else {
        toast.error('Lỗi khi xóa');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    }
  };

  const getLevelBadge = (level: string) => {
    const opt = LEVEL_OPTIONS.find(o => o.value === level);
    return opt ? (
      <span className={`px-2.5 py-1 rounded-full text-white text-xs font-medium ${opt.color}`}>
        {opt.icon} {opt.label}
      </span>
    ) : <Badge variant="secondary">{level}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${opt.color}`}>
        {opt.label}
      </span>
    ) : <Badge variant="secondary">{status}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <Award className="h-7 w-7" />
            </div>
            Quản lý Khen thưởng - Kỷ luật
          </h1>
          <p className="text-gray-500 mt-1">Hệ thống quản lý thi đua khen thưởng và xử lý kỷ luật</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchRecords()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
          </Button>
          <Button onClick={() => openDialog('create')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Thêm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Tổng số</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-100/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Khen thưởng</p>
                <p className="text-3xl font-bold">{stats.rewards}</p>
              </div>
              <Trophy className="h-12 w-12 text-yellow-200/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Kỷ luật</p>
                <p className="text-3xl font-bold">{stats.disciplines}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-100/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Còn hiệu lực</p>
                <p className="text-3xl font-bold">{records.filter(r => r.status === 'ACTIVE').length}</p>
              </div>
              <Star className="h-12 w-12 text-green-100/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'REWARD' | 'DISCIPLINE')}>
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-sm">
          <TabsTrigger value="REWARD" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">
            <Trophy className="h-4 w-4 mr-2" /> Khen thưởng
          </TabsTrigger>
          <TabsTrigger value="DISCIPLINE" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4 mr-2" /> Kỷ luật
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Filters */}
          <Card className="mb-4 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm theo tên, mã số, quyết định..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cấp khen thưởng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả cấp</SelectItem>
                    {LEVEL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.icon} {opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {activeTab === 'REWARD' ? <Trophy className="h-8 w-8 text-gray-400" /> : <AlertTriangle className="h-8 w-8 text-gray-400" />}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Chưa có dữ liệu</h3>
                  <p className="text-gray-500 mt-1">Bấm "Thêm mới" để tạo bản ghi đầu tiên</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-white">
                      <TableHead className="font-semibold">Cán bộ</TableHead>
                      <TableHead className="font-semibold">{activeTab === 'REWARD' ? 'Danh hiệu/Hình thức' : 'Mức kỷ luật'}</TableHead>
                      <TableHead className="font-semibold">Cấp</TableHead>
                      <TableHead className="font-semibold">Số QĐ</TableHead>
                      <TableHead className="font-semibold">Ngày hiệu lực</TableHead>
                      <TableHead className="font-semibold">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${activeTab === 'REWARD' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gradient-to-br from-red-400 to-rose-500'}`}>
                              {record.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{record.user.name}</p>
                              <p className="text-sm text-gray-500">
                                {record.user.rank} - {record.user.unitRelation?.name || 'Chưa xác định'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-900">{record.title}</p>
                          {record.reason && (
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">{record.reason}</p>
                          )}
                        </TableCell>
                        <TableCell>{getLevelBadge(record.level)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <FileText className="h-4 w-4" />
                            {record.decisionNumber || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatDate(record.effectiveDate)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openDialog('view', record)} title="Xem chi tiết">
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openDialog('edit', record)} title="Chỉnh sửa">
                              <Edit2 className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRecordToDelete(record); setDeleteDialogOpen(true); }} title="Xóa">
                              <Trash2 className="h-4 w-4 text-red-600" />
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
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-500">Trang {page} / {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Trước
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit/View Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {formData.recordType === 'REWARD' ? (
                <><Trophy className="h-5 w-5 text-yellow-500" /> {dialogMode === 'create' ? 'Thêm khen thưởng' : dialogMode === 'edit' ? 'Sửa khen thưởng' : 'Chi tiết khen thưởng'}</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-red-500" /> {dialogMode === 'create' ? 'Thêm kỷ luật' : dialogMode === 'edit' ? 'Sửa kỷ luật' : 'Chi tiết kỷ luật'}</>
              )}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' ? 'Xem thông tin chi tiết' : 'Điền đầy đủ thông tin bên dưới'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label className="text-sm font-medium">Cán bộ <span className="text-red-500">*</span></Label>
              <Select
                value={formData.userId}
                onValueChange={(v) => setFormData({ ...formData, userId: v })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={loadingUsers ? 'Đang tải...' : 'Chọn cán bộ'} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{u.name}</span>
                        {u.rank && <span className="text-gray-400">- {u.rank}</span>}
                        {u.unitRelation && <span className="text-gray-400">({u.unitRelation.name})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-medium">{formData.recordType === 'REWARD' ? 'Danh hiệu/Hình thức khen thưởng' : 'Hình thức kỷ luật'} <span className="text-red-500">*</span></Label>
              {formData.recordType === 'REWARD' ? (
                <Select
                  value={formData.title}
                  onValueChange={(v) => setFormData({ ...formData, title: v })}
                  disabled={dialogMode === 'view'}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chọn danh hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    {REWARD_TITLES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                    <SelectItem value="custom">Khác (nhập tự do)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={formData.title}
                  onValueChange={(v) => setFormData({ ...formData, title: v })}
                  disabled={dialogMode === 'view'}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Chọn hình thức kỷ luật" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.label}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formData.title === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="Nhập danh hiệu..."
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium">Cấp khen thưởng/kỷ luật</Label>
              <Select
                value={formData.level}
                onValueChange={(v) => setFormData({ ...formData, level: v })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.icon} {opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Số quyết định</Label>
              <Input
                className="mt-1.5"
                placeholder="VD: QĐ-KT-2024-001"
                value={formData.decisionNumber}
                onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Ngày quyết định</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={formData.decisionDate}
                onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Ngày hiệu lực</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            {formData.recordType === 'DISCIPLINE' && (
              <div>
                <Label className="text-sm font-medium">Ngày hết hạn</Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Người ký</Label>
              <Input
                className="mt-1.5"
                placeholder="VD: Giám đốc Học viện"
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Chức vụ người ký</Label>
              <Input
                className="mt-1.5"
                placeholder="VD: Trung tướng"
                value={formData.signerPosition}
                onChange={(e) => setFormData({ ...formData, signerPosition: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Đơn vị ban hành</Label>
              <Input
                className="mt-1.5"
                placeholder="VD: Học viện Hậu cần"
                value={formData.issuingUnit}
                onChange={(e) => setFormData({ ...formData, issuingUnit: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
                disabled={dialogMode === 'view'}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-sm font-medium">Lý do {formData.recordType === 'REWARD' ? 'khen thưởng' : 'kỷ luật'}</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Nhập lý do..."
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Đóng
            </Button>
            {dialogMode !== 'view' && (
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {dialogMode === 'edit' ? 'Cập nhật' : 'Lưu'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa bản ghi <strong>&quot;{recordToDelete?.title}&quot;</strong> của <strong>{recordToDelete?.user.name}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
