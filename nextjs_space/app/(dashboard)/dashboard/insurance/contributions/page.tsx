/**
 * Contributions Management - Quản lý Đóng góp BHXH
 * Tính theo bảng lương quân đội
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Plus, RefreshCw, Search, Download, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';

const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export default function ContributionsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchForm, setBatchForm] = useState({ periodMonth: (new Date().getMonth() + 1).toString(), periodYear: new Date().getFullYear().toString(), documentNumber: '' });
  const [showSalaryTable, setShowSalaryTable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchData(); }, [search, year, month, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (year) params.set('year', year);
      if (month) params.set('month', month);
      const res = await fetch(`/api/insurance/contributions?${params}`);
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBatchCreate() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/insurance/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchForm),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setShowBatchDialog(false);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Lỗi tạo đóng góp');
    } finally {
      setSubmitting(false);
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `Tháng ${i + 1}` }));

  if (status === 'loading') return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Quản lý Đóng góp BHXH"
        description="Quản lý đóng góp BHXH theo bảng lương cấp bậc"
        icon={<DollarSign className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSalaryTable(true)}>
              <Calculator className="h-4 w-4 mr-2" />Bảng lương
            </Button>
            <Button onClick={() => setShowBatchDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />Tạo đóng góp hàng loạt
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tổng đóng góp</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Phần NLĐ (10.5%)</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.employeeTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Phần ĐV (21.5%)</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.summary.employerTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Số bản ghi</p>
              <p className="text-2xl font-bold">{data.summary.recordCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã quân nhân..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Năm" /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={month || '__ALL__'} onValueChange={(v) => { setMonth(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Tháng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
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
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-center">Kỳ</TableHead>
                    <TableHead className="text-right">Lương cơ sở</TableHead>
                    <TableHead className="text-right">Phần NLĐ</TableHead>
                    <TableHead className="text-right">Phần ĐV</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
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
                      <TableCell><Badge variant="outline">{r.insuranceInfo?.user?.rank}</Badge></TableCell>
                      <TableCell className="text-sm">{r.insuranceInfo?.user?.unitRelation?.name}</TableCell>
                      <TableCell className="text-center">{r.periodMonth}/{r.periodYear}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(r.baseSalary) || 0)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(Number(r.employeeShare) || 0)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(Number(r.employerShare) || 0)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{formatCurrency(Number(r.amount) || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị {((page - 1) * 20) + 1} - {Math.min(page * 20, data.pagination.total)} / {data.pagination.total}
                  </p>
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

      {/* Batch Create Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Đóng góp Hàng loạt</DialogTitle>
            <DialogDescription>Tự động tạo bản ghi đóng góp BHXH cho tất cả cán bộ trong kỳ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tháng</Label>
                <Select value={batchForm.periodMonth} onValueChange={(v) => setBatchForm(f => ({ ...f, periodMonth: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Năm</Label>
                <Select value={batchForm.periodYear} onValueChange={(v) => setBatchForm(f => ({ ...f, periodYear: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Số chứng từ</Label>
              <Input
                value={batchForm.documentNumber}
                onChange={(e) => setBatchForm(f => ({ ...f, documentNumber: e.target.value }))}
                placeholder="VD: CT-BHXH-2026-01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>Hủy</Button>
            <Button onClick={handleBatchCreate} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo đóng góp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Table Dialog */}
      <Dialog open={showSalaryTable} onOpenChange={setShowSalaryTable}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bảng Lương Quân đội & Tỷ lệ Đóng BHXH</DialogTitle>
            <DialogDescription>Mức lương cơ sở: 1.800.000 VNĐ</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cấp bậc</TableHead>
                <TableHead className="text-right">Hệ số</TableHead>
                <TableHead className="text-right">Lương</TableHead>
                <TableHead className="text-right">NLĐ (10.5%)</TableHead>
                <TableHead className="text-right">ĐV (21.5%)</TableHead>
                <TableHead className="text-right">Tổng (32%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.salaryTable || []).map((s: any) => (
                <TableRow key={s.rank}>
                  <TableCell className="font-medium">{s.rank}</TableCell>
                  <TableCell className="text-right">{s.coefficient}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.baseSalary)}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(s.employeeShare)}</TableCell>
                  <TableCell className="text-right text-purple-600">{formatCurrency(s.employerShare)}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{formatCurrency(s.totalContribution)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
