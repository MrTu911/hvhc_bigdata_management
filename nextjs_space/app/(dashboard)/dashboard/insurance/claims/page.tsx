/**
 * Insurance Claims Management - Quản lý Yêu cầu Chế độ BHXH
 * Full CRUD với workflow: DRAFT -> PENDING -> UNDER_REVIEW -> APPROVED -> PAID
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileCheck, Plus, RefreshCw, Search, Eye, Edit, Trash2, Send, CheckCircle, XCircle, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const CLAIM_TYPES = [
  { value: 'SICK_LEAVE', label: 'Ốm đau' },
  { value: 'MATERNITY', label: 'Thai sản' },
  { value: 'OCCUPATIONAL_DISEASE', label: 'Bệnh nghề nghiệp' },
  { value: 'WORK_ACCIDENT', label: 'Tai nạn lao động' },
  { value: 'RETIREMENT', label: 'Hưu trí' },
  { value: 'SURVIVORSHIP', label: 'Tử tuất' },
  { value: 'MEDICAL_EXPENSE', label: 'Chi phí KCB' },
  { value: 'OTHER', label: 'Khác' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT: { label: 'Nháp', color: 'bg-gray-500', variant: 'secondary' },
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-500', variant: 'outline' },
  UNDER_REVIEW: { label: 'Đang xét', color: 'bg-blue-500', variant: 'default' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-500', variant: 'default' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-500', variant: 'destructive' },
  PAID: { label: 'Đã chi', color: 'bg-emerald-500', variant: 'default' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-400', variant: 'secondary' },
};

const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function ClaimsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterType, setFilterType] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState<{ action: string; record: any } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    insuranceInfoId: '',
    userId: '',
    claimType: '',
    amount: '',
    benefitDays: '',
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    hospitalName: '',
    diagnosis: '',
  });
  const [actionForm, setActionForm] = useState({
    calculatedAmount: '',
    documentNumber: '',
    documentDate: '',
    rejectReason: '',
    paymentReference: '',
  });

  // Insurance users for dropdown
  const [insuranceUsers, setInsuranceUsers] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchData(); }, [search, filterStatus, filterType, year, page]);

  useEffect(() => {
    // Fetch insurance users for create form
    fetch('/api/insurance?limit=500').then(r => r.json()).then(d => setInsuranceUsers(d.records || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20', year });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('claimType', filterType);
      const res = await fetch(`/api/insurance/claims?${params}`);
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!createForm.insuranceInfoId || !createForm.claimType) {
      toast.error('Vui lòng chọn đối tượng và loại chế độ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, submitNow: true }),
      });
      if (res.ok) {
        toast.success('Tạo yêu cầu thành công');
        setShowCreateDialog(false);
        setCreateForm({ insuranceInfoId: '', userId: '', claimType: '', amount: '', benefitDays: '', startDate: '', endDate: '', reason: '', description: '', hospitalName: '', diagnosis: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi tạo yêu cầu');
      }
    } catch (error) {
      toast.error('Lỗi tạo yêu cầu');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(action: string, record: any) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, action, ...actionForm }),
      });
      if (res.ok) {
        toast.success('Cập nhật thành công');
        setShowActionDialog(null);
        setActionForm({ calculatedAmount: '', documentNumber: '', documentDate: '', rejectReason: '', paymentReference: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi cập nhật');
      }
    } catch (error) {
      toast.error('Lỗi cập nhật');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xóa yêu cầu này?')) return;
    try {
      const res = await fetch(`/api/insurance/claims?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Yêu cầu Chế độ BHXH"
        description="Quản lý yêu cầu hưởng các chế độ BHXH"
        icon={<FileCheck className="h-6 w-6" />}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Tạo yêu cầu mới
          </Button>
        }
      />

      {/* Stats by Status */}
      {data?.stats?.byStatus && (
        <div className="flex flex-wrap gap-2">
          {data.stats.byStatus.map((s: any) => (
            <Button
              key={s.status}
              variant={filterStatus === s.status ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setFilterStatus(filterStatus === s.status ? '' : s.status); setPage(1); }}
            >
              <Badge variant={STATUS_CONFIG[s.status]?.variant || 'secondary'} className="mr-2">{s.count}</Badge>
              {s.label}
            </Button>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={filterType || '__ALL__'} onValueChange={(v) => { setFilterType(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Loại chế độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {CLAIM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cán bộ</TableHead>
                    <TableHead>Loại chế độ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.records || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{r.insuranceInfo?.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{r.insuranceInfo?.user?.militaryId}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.claimTypeLabel}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[r.status]?.variant || 'secondary'}>
                          {r.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {r.calculatedAmount ? formatCurrency(Number(r.calculatedAmount)) : (r.amount ? formatCurrency(Number(r.amount)) : '-')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: vi }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedRecord(r); setShowViewDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === 'PENDING' && (
                            <Button variant="ghost" size="icon" className="text-blue-600" onClick={() => setShowActionDialog({ action: 'review', record: r })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {r.status === 'UNDER_REVIEW' && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => setShowActionDialog({ action: 'approve', record: r })}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setShowActionDialog({ action: 'reject', record: r })}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {r.status === 'APPROVED' && (
                            <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => setShowActionDialog({ action: 'pay', record: r })}>
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          {['DRAFT', 'PENDING'].includes(r.status) && (
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(r.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Trang {page} / {data.pagination.totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Yêu cầu Chế độ BHXH</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Đối tượng hưởng *</Label>
                <Select value={createForm.insuranceInfoId} onValueChange={(v) => setCreateForm(f => ({ ...f, insuranceInfoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn cán bộ" /></SelectTrigger>
                  <SelectContent>
                    {insuranceUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.user?.name} - {u.user?.militaryId} ({u.user?.rank})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loại chế độ *</Label>
                <Select value={createForm.claimType} onValueChange={(v) => setCreateForm(f => ({ ...f, claimType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>
                    {CLAIM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số tiền yêu cầu</Label>
                <Input type="number" value={createForm.amount} onChange={(e) => setCreateForm(f => ({ ...f, amount: e.target.value }))} placeholder="VNĐ" />
              </div>
              <div>
                <Label>Số ngày hưởng</Label>
                <Input type="number" value={createForm.benefitDays} onChange={(e) => setCreateForm(f => ({ ...f, benefitDays: e.target.value }))} />
              </div>
              <div>
                <Label>Cơ sở y tế</Label>
                <Input value={createForm.hospitalName} onChange={(e) => setCreateForm(f => ({ ...f, hospitalName: e.target.value }))} />
              </div>
              <div>
                <Label>Từ ngày</Label>
                <Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label>Đến ngày</Label>
                <Input type="date" value={createForm.endDate} onChange={(e) => setCreateForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Chẩn đoán</Label>
                <Input value={createForm.diagnosis} onChange={(e) => setCreateForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Lý do</Label>
                <Textarea value={createForm.reason} onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Yêu cầu</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cán bộ</p>
                  <p className="font-medium">{selectedRecord.insuranceInfo?.user?.name}</p>
                  <p className="text-sm">{selectedRecord.insuranceInfo?.user?.militaryId} - {selectedRecord.insuranceInfo?.user?.rank}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={STATUS_CONFIG[selectedRecord.status]?.variant}>{selectedRecord.statusLabel}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại chế độ</p>
                  <p className="font-medium">{selectedRecord.claimTypeLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="font-medium text-green-600">
                    {selectedRecord.calculatedAmount ? formatCurrency(Number(selectedRecord.calculatedAmount)) : (selectedRecord.amount ? formatCurrency(Number(selectedRecord.amount)) : '-')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian hưởng</p>
                  <p className="font-medium">
                    {selectedRecord.startDate && format(new Date(selectedRecord.startDate), 'dd/MM/yyyy')} - {selectedRecord.endDate && format(new Date(selectedRecord.endDate), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số ngày</p>
                  <p className="font-medium">{selectedRecord.benefitDays || '-'} ngày</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Cơ sở y tế</p>
                  <p className="font-medium">{selectedRecord.hospitalName || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Chẩn đoán</p>
                  <p className="font-medium">{selectedRecord.diagnosis || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Lý do</p>
                  <p>{selectedRecord.reason || '-'}</p>
                </div>
                {selectedRecord.rejectReason && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Lý do từ chối</p>
                    <p className="text-red-600">{selectedRecord.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!showActionDialog} onOpenChange={() => setShowActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showActionDialog?.action === 'review' && 'Xét duyệt Yêu cầu'}
              {showActionDialog?.action === 'approve' && 'Phê duyệt Yêu cầu'}
              {showActionDialog?.action === 'reject' && 'Từ chối Yêu cầu'}
              {showActionDialog?.action === 'pay' && 'Chi trả Yêu cầu'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showActionDialog?.action === 'approve' && (
              <>
                <div>
                  <Label>Số tiền phê duyệt</Label>
                  <Input type="number" value={actionForm.calculatedAmount} onChange={(e) => setActionForm(f => ({ ...f, calculatedAmount: e.target.value }))} />
                </div>
                <div>
                  <Label>Số quyết định</Label>
                  <Input value={actionForm.documentNumber} onChange={(e) => setActionForm(f => ({ ...f, documentNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>Ngày quyết định</Label>
                  <Input type="date" value={actionForm.documentDate} onChange={(e) => setActionForm(f => ({ ...f, documentDate: e.target.value }))} />
                </div>
              </>
            )}
            {showActionDialog?.action === 'reject' && (
              <div>
                <Label>Lý do từ chối *</Label>
                <Textarea value={actionForm.rejectReason} onChange={(e) => setActionForm(f => ({ ...f, rejectReason: e.target.value }))} rows={3} />
              </div>
            )}
            {showActionDialog?.action === 'pay' && (
              <div>
                <Label>Số chứng từ chi</Label>
                <Input value={actionForm.paymentReference} onChange={(e) => setActionForm(f => ({ ...f, paymentReference: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(null)}>Hủy</Button>
            <Button onClick={() => handleAction(showActionDialog!.action, showActionDialog!.record)} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
