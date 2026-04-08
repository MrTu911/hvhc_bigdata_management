'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { DebtSummaryCard } from '@/components/party/fee/debt-summary-card';
import { PartyFeeTable } from '@/components/party/fee/party-fee-table';
import { Plus, Zap, Search, X, Wallet } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Đã nộp đủ' },
  { value: 'PARTIAL', label: 'Nộp thiếu' },
  { value: 'UNPAID', label: 'Chưa nộp' },
];

function recentMonths(n = 6): string[] {
  const months: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return months;
}

export default function PartyFeesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [memberOptions, setMemberOptions] = useState<any[]>([]);

  // Filter state
  const [paymentMonth, setPaymentMonth] = useState('');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Add payment dialog state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    partyMemberId: '',
    paymentMonth: '',
    expectedAmount: '',
    actualAmount: '0',
    paymentDate: '',
    note: '',
  });

  // Auto-generate dialog state
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ paymentMonth: '', expectedAmount: '' });
  const [genLoading, setGenLoading] = useState(false);

  const months = recentMonths(6);

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '15' });
      if (paymentMonth) params.set('paymentMonth', paymentMonth);
      if (status !== 'ALL') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/party/fees?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được dữ liệu');
      setItems(data.data || []);
      setSummary(data.debtSummary || null);
      setPagination(data.pagination || { page: p, totalPages: 1, total: 0 });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [paymentMonth, status, search, page]);

  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paymentMonth, status]);

  useEffect(() => {
    fetch('/api/party-members?limit=200')
      .then((r) => r.json())
      .then((d) => setMemberOptions(d.members || d.data || []))
      .catch(() => {});
  }, []);

  const handleFilter = () => { setPage(1); fetchData(1); };

  const handleMonthTab = (m: string) => {
    setPaymentMonth((prev) => (prev === m ? '' : m));
    setPage(1);
  };

  const savePayment = async () => {
    try {
      const res = await fetch('/api/party/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyMemberId: addForm.partyMemberId,
          paymentMonth: addForm.paymentMonth,
          expectedAmount: Number(addForm.expectedAmount),
          actualAmount: Number(addForm.actualAmount),
          paymentDate: addForm.paymentDate || undefined,
          note: addForm.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu đảng phí thất bại');
      toast({ title: 'Thành công', description: 'Đã lưu bản ghi đảng phí' });
      setShowAdd(false);
      setAddForm({ partyMemberId: '', paymentMonth: '', expectedAmount: '', actualAmount: '0', paymentDate: '', note: '' });
      fetchData(1);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const autoGenerate = async () => {
    setGenLoading(true);
    try {
      const res = await fetch('/api/party/fees/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMonth: genForm.paymentMonth, expectedAmount: Number(genForm.expectedAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo đảng phí tự động thất bại');
      toast({ title: 'Thành công', description: `Đã tạo ${data.data?.generatedCount || 0} bản ghi cho tháng ${genForm.paymentMonth}` });
      setShowGen(false);
      setGenForm({ paymentMonth: '', expectedAmount: '' });
      fetchData(1);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 shadow-md shadow-red-200">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Quản lý đảng phí</h1>
              <p className="text-sm text-slate-500">Theo dõi thu nộp, nợ đảng phí và phát sinh tự động theo tháng</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-generate dialog */}
            <Dialog open={showGen} onOpenChange={setShowGen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Zap className="h-4 w-4 mr-1.5 text-amber-500" /> Tạo tự động
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Tạo đảng phí tự động
                  </DialogTitle>
                </DialogHeader>
                <p className="text-xs text-slate-500 -mt-1">
                  Tạo bản ghi UNPAID cho tất cả đảng viên trạng thái Dự bị / Chính thức trong tháng chỉ định.
                  Nếu đã tồn tại bản ghi cho tháng đó sẽ bỏ qua.
                </p>
                <div className="space-y-4 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tháng (YYYY-MM) *</Label>
                    <Input
                      className="mt-1"
                      placeholder="Ví dụ: 2025-04"
                      value={genForm.paymentMonth}
                      onChange={(e) => setGenForm((f) => ({ ...f, paymentMonth: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mức phải nộp (đ) *</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      placeholder="Ví dụ: 50000"
                      value={genForm.expectedAmount}
                      onChange={(e) => setGenForm((f) => ({ ...f, expectedAmount: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="outline" onClick={() => setShowGen(false)}>Hủy</Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      disabled={genLoading || !genForm.paymentMonth || !genForm.expectedAmount}
                      onClick={autoGenerate}
                    >
                      {genLoading ? 'Đang tạo...' : 'Tạo đảng phí'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add payment dialog */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 shadow-sm h-9">
                  <Plus className="h-4 w-4 mr-1.5" /> Cập nhật nộp phí
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Wallet className="h-4 w-4 text-red-600" />
                    Cập nhật nộp phí (upsert)
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Đảng viên *</Label>
                    <Select
                      value={addForm.partyMemberId || 'NONE'}
                      onValueChange={(v) => setAddForm((f) => ({ ...f, partyMemberId: v === 'NONE' ? '' : v }))}
                    >
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn đảng viên" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Chọn đảng viên</SelectItem>
                        {memberOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.user?.name || m.partyMemberName || m.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tháng *</Label>
                      <Input
                        className="mt-1"
                        placeholder="YYYY-MM"
                        value={addForm.paymentMonth}
                        onChange={(e) => setAddForm((f) => ({ ...f, paymentMonth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ngày nộp</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={addForm.paymentDate}
                        onChange={(e) => setAddForm((f) => ({ ...f, paymentDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phải nộp (đ) *</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        placeholder="50000"
                        value={addForm.expectedAmount}
                        onChange={(e) => setAddForm((f) => ({ ...f, expectedAmount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Đã nộp (đ)</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        placeholder="0"
                        value={addForm.actualAmount}
                        onChange={(e) => setAddForm((f) => ({ ...f, actualAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ghi chú</Label>
                    <Textarea
                      className="mt-1 resize-none"
                      rows={2}
                      placeholder="Ghi chú (nếu có)..."
                      value={addForm.note}
                      onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="outline" onClick={() => setShowAdd(false)}>Hủy</Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!addForm.partyMemberId || !addForm.paymentMonth || !addForm.expectedAmount}
                      onClick={savePayment}
                    >
                      Lưu bản ghi
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── KPI Summary ── */}
        <DebtSummaryCard summary={summary} />

        {/* ── Month quick-tabs ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Lọc nhanh tháng:</span>
          <div className="flex gap-1 flex-wrap">
            {months.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => handleMonthTab(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  paymentMonth === m
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {m}
              </button>
            ))}
            {paymentMonth && !months.includes(paymentMonth) && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                {paymentMonth}
              </span>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              className="pl-9 bg-white border-slate-200 h-10"
              placeholder="Tìm theo tên đảng viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-44 h-10 bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {STATUS_OPTIONS.map((x) => (
                <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="w-36 h-10 bg-white border-slate-200 font-mono text-sm"
            placeholder="Tháng YYYY-MM"
            value={paymentMonth}
            onChange={(e) => setPaymentMonth(e.target.value)}
          />
          <Button onClick={handleFilter} className="h-10 bg-red-600 hover:bg-red-700">
            <Search className="h-4 w-4 mr-1.5" /> Lọc
          </Button>
          {(search || status !== 'ALL' || paymentMonth) && (
            <Button
              variant="ghost"
              className="h-10 px-3 text-slate-500"
              onClick={() => { setSearch(''); setStatus('ALL'); setPaymentMonth(''); setPage(1); }}
            >
              <X className="h-4 w-4 mr-1" /> Xóa lọc
            </Button>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <PartyFeeTable
            items={items}
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        )}

      </div>
    </div>
  );
}
