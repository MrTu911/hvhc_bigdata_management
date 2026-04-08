/**
 * Dependents Management - Quản lý Người phụ thuộc BHXH
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, RefreshCw, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const RELATIONSHIPS = [
  { value: 'SPOUSE', label: 'Vợ/Chồng' },
  { value: 'CHILD', label: 'Con' },
  { value: 'PARENT', label: 'Cha/Mẹ' },
  { value: 'SIBLING', label: 'Anh/Chị/Em' },
  { value: 'GRANDPARENT', label: 'Ông/Bà' },
  { value: 'GRANDCHILD', label: 'Cháu' },
  { value: 'OTHER', label: 'Khác' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ACTIVE: { label: 'Hoạt động', variant: 'default' },
  INACTIVE: { label: 'Không hoạt động', variant: 'secondary' },
  PENDING: { label: 'Chờ duyệt', variant: 'secondary' },
};

export default function DependentsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [dependents, setDependents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    insuranceInfoId: '',
    fullName: '',
    relationship: '',
    dateOfBirth: '',
    gender: '',
    citizenId: '',
    healthInsuranceNumber: '',
    healthInsuranceStartDate: '',
    healthInsuranceEndDate: '',
    healthInsuranceHospital: '',
    documentNumber: '',
    documentDate: '',
    notes: '',
  });

  const [insuranceUsers, setInsuranceUsers] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    fetch('/api/insurance?limit=500').then(r => r.json()).then(d => setInsuranceUsers(d.records || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/insurance/dependents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDependents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm({
      insuranceInfoId: '',
      fullName: '',
      relationship: '',
      dateOfBirth: '',
      gender: '',
      citizenId: '',
      healthInsuranceNumber: '',
      healthInsuranceStartDate: '',
      healthInsuranceEndDate: '',
      healthInsuranceHospital: '',
      documentNumber: '',
      documentDate: '',
      notes: '',
    });
    setShowDialog(true);
  }

  function openEdit(record: any) {
    setEditingRecord(record);
    setForm({
      insuranceInfoId: record.insuranceInfoId || '',
      fullName: record.fullName || '',
      relationship: record.relationship || '',
      dateOfBirth: record.dateOfBirth ? format(new Date(record.dateOfBirth), 'yyyy-MM-dd') : '',
      gender: record.gender || '',
      citizenId: record.citizenId || '',
      healthInsuranceNumber: record.healthInsuranceNumber || '',
      healthInsuranceStartDate: record.healthInsuranceStartDate ? format(new Date(record.healthInsuranceStartDate), 'yyyy-MM-dd') : '',
      healthInsuranceEndDate: record.healthInsuranceEndDate ? format(new Date(record.healthInsuranceEndDate), 'yyyy-MM-dd') : '',
      healthInsuranceHospital: record.healthInsuranceHospital || '',
      documentNumber: record.documentNumber || '',
      documentDate: record.documentDate ? format(new Date(record.documentDate), 'yyyy-MM-dd') : '',
      notes: record.notes || '',
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.fullName || !form.relationship) {
      toast.error('Vui lòng nhập họ tên và quan hệ');
      return;
    }
    if (!editingRecord && !form.insuranceInfoId) {
      toast.error('Vui lòng chọn cán bộ');
      return;
    }
    setSubmitting(true);
    try {
      const url = '/api/insurance/dependents';
      const method = editingRecord ? 'PUT' : 'POST';
      const body = editingRecord ? { id: editingRecord.id, ...form } : form;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        toast.success(editingRecord ? 'Cập nhật thành công' : 'Thêm mới thành công');
        setShowDialog(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi');
      }
    } catch (error) {
      toast.error('Lỗi xử lý');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xóa người phụ thuộc này?')) return;
    try {
      const res = await fetch(`/api/insurance/dependents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  }

  const filteredDependents = dependents.filter(d => {
    if (search && !d.fullName?.toLowerCase().includes(search.toLowerCase()) && 
        !d.insuranceInfo?.user?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRelationship && d.relationship !== filterRelationship) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Quản lý Người phụ thuộc"
        description="Quản lý thông tin người phụ thuộc BHYT"
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Thêm người phụ thuộc
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{dependents.length}</p>
            <p className="text-sm text-muted-foreground">Tổng số</p>
          </CardContent>
        </Card>
        {RELATIONSHIPS.slice(0, 3).map(rel => (
          <Card key={rel.value}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{dependents.filter(d => d.relationship === rel.value).length}</p>
              <p className="text-sm text-muted-foreground">{rel.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm theo tên..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={filterRelationship || '__ALL__'} onValueChange={(v) => setFilterRelationship(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Quan hệ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus || '__ALL__'} onValueChange={(v) => setFilterStatus(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Không HT</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người phụ thuộc</TableHead>
                  <TableHead>Quan hệ</TableHead>
                  <TableHead>Người lao động</TableHead>
                  <TableHead>Số thẻ BHYT</TableHead>
                  <TableHead>Hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDependents.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.fullName}</p>
                        <p className="text-sm text-muted-foreground">{d.dateOfBirth ? format(new Date(d.dateOfBirth), 'dd/MM/yyyy') : '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{RELATIONSHIPS.find(r => r.value === d.relationship)?.label || d.relationship}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.insuranceInfo?.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{d.insuranceInfo?.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{d.healthInsuranceNumber || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {d.healthInsuranceStartDate && d.healthInsuranceEndDate ? (
                        <span>
                          {format(new Date(d.healthInsuranceStartDate), 'dd/MM/yy')} - {format(new Date(d.healthInsuranceEndDate), 'dd/MM/yy')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[d.status]?.variant || 'secondary'}>
                        {STATUS_CONFIG[d.status]?.label || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Cập nhật Người phụ thuộc' : 'Thêm Người phụ thuộc'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingRecord && (
              <div>
                <Label>Người lao động *</Label>
                <Select value={form.insuranceInfoId} onValueChange={(v) => setForm(f => ({ ...f, insuranceInfoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn cán bộ" /></SelectTrigger>
                  <SelectContent>
                    {insuranceUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.user?.name} - {u.user?.militaryId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ và tên *</Label>
                <Input value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <Label>Quan hệ *</Label>
                <Select value={form.relationship} onValueChange={(v) => setForm(f => ({ ...f, relationship: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ngày sinh</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <Label>Giới tính</Label>
                <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số CCCD</Label>
                <Input value={form.citizenId} onChange={(e) => setForm(f => ({ ...f, citizenId: e.target.value }))} />
              </div>
              <div>
                <Label>Số thẻ BHYT</Label>
                <Input value={form.healthInsuranceNumber} onChange={(e) => setForm(f => ({ ...f, healthInsuranceNumber: e.target.value }))} />
              </div>
              <div>
                <Label>BHYT từ ngày</Label>
                <Input type="date" value={form.healthInsuranceStartDate} onChange={(e) => setForm(f => ({ ...f, healthInsuranceStartDate: e.target.value }))} />
              </div>
              <div>
                <Label>BHYT đến ngày</Label>
                <Input type="date" value={form.healthInsuranceEndDate} onChange={(e) => setForm(f => ({ ...f, healthInsuranceEndDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Nơi KCB ban đầu</Label>
                <Input value={form.healthInsuranceHospital} onChange={(e) => setForm(f => ({ ...f, healthInsuranceHospital: e.target.value }))} />
              </div>
              <div>
                <Label>Số QQ/Hồ sơ</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm(f => ({ ...f, documentNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Ngày QQ</Label>
                <Input type="date" value={form.documentDate} onChange={(e) => setForm(f => ({ ...f, documentDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Ghi chú</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
