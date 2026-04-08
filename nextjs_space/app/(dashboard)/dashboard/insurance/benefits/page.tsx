/**
 * Insurance Benefits - Quản lý Quyền lợi BHXH
 * Theo dõi các khoản hưởng BHXH
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
import { Gift, Plus, RefreshCw, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const BENEFIT_TYPES = [
  { value: 'SICK_LEAVE', label: 'Ốm đau' },
  { value: 'MATERNITY', label: 'Thai sản' },
  { value: 'RETIREMENT', label: 'Hưu trí' },
  { value: 'DEATH', label: 'Tử tuất' },
  { value: 'OCCUPATIONAL', label: 'TNLĐ/BNN' },
  { value: 'UNEMPLOYMENT', label: 'Thất nghiệp' },
  { value: 'OTHER', label: 'Khác' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function BenefitsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    insuranceInfoId: '',
    benefitType: '',
    periodMonth: (new Date().getMonth() + 1).toString(),
    periodYear: new Date().getFullYear().toString(),
    baseSalary: '',
    amount: '',
    benefitPeriod: '',
    benefitReason: '',
    documentNumber: '',
    documentDate: '',
    notes: '',
  });

  const [insuranceUsers, setInsuranceUsers] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchData(); }, [search, filterType, year, page]);

  useEffect(() => {
    fetch('/api/insurance?limit=500').then(r => r.json()).then(d => setInsuranceUsers(d.records || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20', year });
      if (search) params.set('search', search);
      if (filterType) params.set('benefitType', filterType);
      const res = await fetch(`/api/insurance/benefits?${params}`);
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
      insuranceInfoId: '',
      benefitType: '',
      periodMonth: (new Date().getMonth() + 1).toString(),
      periodYear: new Date().getFullYear().toString(),
      baseSalary: '',
      amount: '',
      benefitPeriod: '',
      benefitReason: '',
      documentNumber: '',
      documentDate: '',
      notes: '',
    });
    setShowDialog(true);
  }

  async function handleSubmit() {
    if (!form.insuranceInfoId || !form.benefitType || !form.amount) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      const url = '/api/insurance/benefits';
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
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    try {
      const res = await fetch(`/api/insurance/benefits?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchData();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `Tháng ${i + 1}` }));

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Quản lý Quyền lợi BHXH"
        description="Theo dõi các khoản hưởng BHXH của cán bộ"
        icon={<Gift className="h-6 w-6" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Thêm quyền lợi
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Tổng quyền lợi năm {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data?.summary?.totalAmount || 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">{data?.summary?.recordCount || 0} lượt hưởng</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo loại chế độ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.summary?.byType || []}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                    dataKey="amount" nameKey="label"
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {(data?.summary?.byType || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {BENEFIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
                    <TableHead className="text-center">Kỳ</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Số QĐ</TableHead>
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
                      <TableCell><Badge variant="outline">{r.benefitTypeLabel}</Badge></TableCell>
                      <TableCell className="text-center">{r.periodMonth}/{r.periodYear}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{formatCurrency(Number(r.amount) || 0)}</TableCell>
                      <TableCell className="text-sm">{r.documentNumber || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Thêm Quyền lợi BHXH</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Cán bộ *</Label>
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Loại chế độ *</Label>
                <Select value={form.benefitType} onValueChange={(v) => setForm(f => ({ ...f, benefitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BENEFIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tháng</Label>
                <Select value={form.periodMonth} onValueChange={(v) => setForm(f => ({ ...f, periodMonth: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Năm</Label>
                <Select value={form.periodYear} onValueChange={(v) => setForm(f => ({ ...f, periodYear: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số tiền *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="VNĐ" />
              </div>
              <div>
                <Label>Số ngày/tháng hưởng</Label>
                <Input type="number" value={form.benefitPeriod} onChange={(e) => setForm(f => ({ ...f, benefitPeriod: e.target.value }))} />
              </div>
              <div>
                <Label>Số QĐ</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm(f => ({ ...f, documentNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Ngày QĐ</Label>
                <Input type="date" value={form.documentDate} onChange={(e) => setForm(f => ({ ...f, documentDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Lý do hưởng</Label>
              <Textarea value={form.benefitReason} onChange={(e) => setForm(f => ({ ...f, benefitReason: e.target.value }))} rows={2} />
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
