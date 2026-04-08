/**
 * Medical Facilities Management - Quản lý Cơ sở KCB ban đầu
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, RefreshCw, Search, Edit, Trash2, ChevronLeft, ChevronRight, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';

const FACILITY_TYPES = [
  { value: 'MILITARY_HOSPITAL', label: 'Bệnh viện quân đội' },
  { value: 'CENTRAL_HOSPITAL', label: 'Bệnh viện TW' },
  { value: 'PROVINCIAL_HOSPITAL', label: 'Bệnh viện tỉnh' },
  { value: 'DISTRICT_HOSPITAL', label: 'Bệnh viện huyện' },
  { value: 'CLINIC', label: 'Phòng khám' },
  { value: 'HEALTH_CENTER', label: 'Trạm y tế' },
  { value: 'OTHER', label: 'Khác' },
];

export default function FacilitiesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [page, setPage] = useState(1);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: '',
    address: '',
    province: '',
    district: '',
    phone: '',
    level: '1',
    isActive: true,
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchData(); }, [search, filterType, filterProvince, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (filterType) params.set('type', filterType);
      if (filterProvince) params.set('province', filterProvince);
      const res = await fetch(`/api/insurance/facilities?${params}`);
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingRecord(null);
    setForm({
      code: '',
      name: '',
      type: '',
      address: '',
      province: '',
      district: '',
      phone: '',
      level: '1',
      isActive: true,
      contractStartDate: '',
      contractEndDate: '',
      notes: '',
    });
    setShowDialog(true);
  }

  function openEdit(record: any) {
    setEditingRecord(record);
    setForm({
      code: record.code || '',
      name: record.name || '',
      type: record.type || '',
      address: record.address || '',
      province: record.province || '',
      district: record.district || '',
      phone: record.phone || '',
      level: (record.level || 1).toString(),
      isActive: record.isActive ?? true,
      contractStartDate: record.contractStartDate ? format(new Date(record.contractStartDate), 'yyyy-MM-dd') : '',
      contractEndDate: record.contractEndDate ? format(new Date(record.contractEndDate), 'yyyy-MM-dd') : '',
      notes: record.notes || '',
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.code || !form.name || !form.type) {
      toast.error('Vui lòng điền mã, tên và loại cơ sở');
      return;
    }
    setSubmitting(true);
    try {
      const url = '/api/insurance/facilities';
      const method = editingRecord ? 'PUT' : 'POST';
      const body = editingRecord ? { id: editingRecord.id, ...form, level: parseInt(form.level) } : { ...form, level: parseInt(form.level) };
      
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
    if (!confirm('Bạn có chắc muốn xóa cơ sở này?')) return;
    try {
      const res = await fetch(`/api/insurance/facilities?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  }

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Cơ sở Khám chữa bệnh"
        description="Quản lý danh sách cơ sở KCB ban đầu"
        icon={<Building2 className="h-6 w-6" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Thêm cơ sở
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{data?.pagination?.total || 0}</p>
            <p className="text-sm text-muted-foreground">Tổng số cơ sở</p>
          </CardContent>
        </Card>
        {FACILITY_TYPES.slice(0, 3).map(t => (
          <Card key={t.value}>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{(data?.records || []).filter((r: any) => r.type === t.value).length}</p>
              <p className="text-sm text-muted-foreground">{t.label}</p>
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
                <Input placeholder="Tìm theo tên, mã..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={filterType || '__ALL__'} onValueChange={(v) => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Loại cơ sở" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {FACILITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {data?.filters?.provinces && (
              <Select value={filterProvince || '__ALL__'} onValueChange={(v) => { setFilterProvince(v === '__ALL__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Tỉnh/TP" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Tất cả</SelectItem>
                  {data.filters.provinces.map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên cơ sở</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.records || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-sm text-muted-foreground">Tuyến {r.level}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.typeLabel}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {r.province || r.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {r.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.isActive ? 'default' : 'secondary'}>
                          {r.isActive ? 'Hoạt động' : 'Ngừng'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Trang {page} / {data.pagination.totalPages || 1}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (data.pagination.totalPages || 1)} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Cập nhật Cơ sở KCB' : 'Thêm Cơ sở KCB'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã cơ sở *</Label>
                <Input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VD: BV108" disabled={!!editingRecord} />
              </div>
              <div>
                <Label>Loại cơ sở *</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Tên cơ sở *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Địa chỉ</Label>
                <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Tỉnh/TP</Label>
                <Input value={form.province} onChange={(e) => setForm(f => ({ ...f, province: e.target.value }))} />
              </div>
              <div>
                <Label>Quận/Huyện</Label>
                <Input value={form.district} onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))} />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Tuyến</Label>
                <Select value={form.level} onValueChange={(v) => setForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tuyến 1 - TW</SelectItem>
                    <SelectItem value="2">Tuyến 2 - Tỉnh</SelectItem>
                    <SelectItem value="3">Tuyến 3 - Huyện</SelectItem>
                    <SelectItem value="4">Tuyến 4 - Xã</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>HĐ từ ngày</Label>
                <Input type="date" value={form.contractStartDate} onChange={(e) => setForm(f => ({ ...f, contractStartDate: e.target.value }))} />
              </div>
              <div>
                <Label>HĐ đến ngày</Label>
                <Input type="date" value={form.contractEndDate} onChange={(e) => setForm(f => ({ ...f, contractEndDate: e.target.value }))} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))} />
                <Label>Đang hoạt động</Label>
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
