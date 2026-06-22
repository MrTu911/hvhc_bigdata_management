/**
 * M10 – Phase 3: Trang Vật chất bản đồ (Ban Bản đồ) — giấy + số.
 * Bản đồ mật chỉ hiển thị/tạo khi backend cấp quyền (canSecret từ API).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Layers, Map as MapIcon, Undo2, X, History, Lock, FileDigit,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const MAP_TYPE_LABELS: Record<string, string> = {
  TOPOGRAPHIC: 'Địa hình', TACTICAL: 'Tác chiến', ADMINISTRATIVE: 'Hành chính',
  OPERATIONAL: 'Tác nghiệp', DIGITAL_LAYER: 'Lớp bản đồ số', OTHER: 'Khác',
};
const FORMAT_LABELS: Record<string, string> = { PAPER: 'Giấy', DIGITAL: 'Số' };
const SECURITY_LABELS: Record<string, { label: string; cls: string }> = {
  NORMAL: { label: 'Thường', cls: 'bg-gray-100 text-gray-600' },
  CONFIDENTIAL: { label: 'Mật', cls: 'bg-amber-100 text-amber-700' },
  SECRET: { label: 'Tối mật', cls: 'bg-orange-100 text-orange-700' },
  TOP_SECRET: { label: 'Tuyệt mật', cls: 'bg-red-100 text-red-700' },
};
const LOAN_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ISSUED: { label: 'Đang mượn', cls: 'bg-blue-100 text-blue-700' },
  RETURNED: { label: 'Đã trả', cls: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Quá hạn', cls: 'bg-red-100 text-red-700' },
  LOST: { label: 'Mất', cls: 'bg-gray-200 text-gray-700' },
};

interface MapAsset {
  id: string; code: string; name: string; mapType: string; format: string;
  scale: string | null; sheetNumber: string | null; securityLevel: string;
  quantityTotal: number; quantityAvailable: number; storageLocation: string | null;
  _count?: { loans: number };
}
interface Loan {
  id: string; quantity: number; loanType: string; borrowerName: string | null;
  borrowerUnitId: string | null; issuedAt: string; dueDate: string | null;
  returnedAt: string | null; status: string;
}

const emptyForm = { code: '', name: '', mapType: 'TOPOGRAPHIC', format: 'PAPER', scale: '', sheetNumber: '', securityLevel: 'NORMAL', quantityTotal: 0, storageLocation: '' };
const emptyLoan = { quantity: 1, loanType: 'LOAN', borrowerName: '', purpose: '', dueDate: '' };

export default function MapAssetPage() {
  const [items, setItems] = useState<MapAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [canSecret, setCanSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<MapAsset | null>(null);
  const [loanForm, setLoanForm] = useState(emptyLoan);

  const [detail, setDetail] = useState<MapAsset | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (filterType) params.set('mapType', filterType);
      const res = await fetch(`/api/education/maps?${params}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
        setCanSecret(!!data.data.canSecret);
      } else toast.error(data.error || 'Không tải được kho bản đồ');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [search, filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const fetchDetail = useCallback(async (m: MapAsset) => {
    setDetail(m);
    try {
      const res = await fetch(`/api/education/maps/${m.id}`);
      const data = await res.json();
      if (res.ok && data.success) setLoans(data.data.loans || []);
      else setLoans([]);
    } catch { setLoans([]); }
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.name) { toast.error('Mã và tên là bắt buộc'); return; }
    try {
      const res = await fetch('/api/education/maps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantityTotal: Number(form.quantityTotal) }),
      });
      const data = await res.json();
      if (res.ok && data.success) { toast.success('Đã thêm bản đồ'); setCreateOpen(false); setForm(emptyForm); fetchItems(); }
      else toast.error(data.error || 'Lỗi tạo');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleIssue = async () => {
    if (!issueTarget) return;
    if (Number(loanForm.quantity) <= 0) { toast.error('Số lượng phải > 0'); return; }
    try {
      const res = await fetch(`/api/education/maps/${issueTarget.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue', ...loanForm, quantity: Number(loanForm.quantity) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã cấp phát bản đồ'); setIssueOpen(false); setLoanForm(emptyLoan); fetchItems();
        if (detail?.id === issueTarget.id) fetchDetail(issueTarget);
      } else toast.error(data.error || 'Lỗi cấp phát');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleReturn = async (mapId: string, loanId: string) => {
    try {
      const res = await fetch(`/api/education/maps/${mapId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return', loanId }),
      });
      const data = await res.json();
      if (res.ok && data.success) { toast.success('Đã thu hồi'); fetchItems(); if (detail) fetchDetail(detail); }
      else toast.error(data.error || 'Lỗi thu hồi');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const totalAvailable = items.reduce((s, m) => s + m.quantityAvailable, 0);
  const digitalCount = items.filter(m => m.format === 'DIGITAL').length;
  const securityOptions = canSecret ? Object.keys(SECURITY_LABELS) : ['NORMAL'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MapIcon className="h-6 w-6 text-emerald-600" /> Vật chất bản đồ</h1>
          <p className="text-muted-foreground">Ban Bản đồ — kho bản đồ giấy & số, cấp phát/mượn-trả{canSecret ? '' : ' (chỉ bản đồ thường)'}</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Thêm bản đồ</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100"><Layers className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-muted-foreground">Đầu mục bản đồ</p><p className="text-2xl font-bold">{total}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100"><MapIcon className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Tồn khả dụng</p><p className="text-2xl font-bold text-green-600">{totalAvailable}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100"><FileDigit className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Bản đồ số</p><p className="text-2xl font-bold text-blue-600">{digitalCount}</p></div></CardContent></Card>
      </div>

      <Card><CardContent className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Tìm theo mã, tên, số hiệu mảnh..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType || '__ALL__'} onValueChange={v => setFilterType(v === '__ALL__' ? '' : v)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Loại bản đồ" /></SelectTrigger>
          <SelectContent><SelectItem value="__ALL__">Tất cả loại</SelectItem>{Object.entries(MAP_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchItems}><RefreshCw className="h-4 w-4" /></Button>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>Loại</TableHead><TableHead>Định dạng</TableHead>
            <TableHead>Tỉ lệ</TableHead><TableHead className="text-center">Khả dụng/Tổng</TableHead><TableHead>Cấp độ</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Chưa có bản đồ nào</TableCell></TableRow>
            ) : items.map(m => {
              const sec = SECURITY_LABELS[m.securityLevel] ?? { label: m.securityLevel, cls: 'bg-gray-100' };
              return (
                <TableRow key={m.id} className={detail?.id === m.id ? 'bg-emerald-50' : ''}>
                  <TableCell className="font-mono text-sm font-medium">{m.code}</TableCell>
                  <TableCell className="text-sm">{m.name}{m.sheetNumber ? <span className="text-xs text-muted-foreground ml-1">({m.sheetNumber})</span> : null}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{MAP_TYPE_LABELS[m.mapType] ?? m.mapType}</TableCell>
                  <TableCell className="text-sm">{FORMAT_LABELS[m.format] ?? m.format}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.scale ?? '—'}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline">{m.quantityAvailable}/{m.quantityTotal}</Badge></TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${sec.cls}`}>{m.securityLevel !== 'NORMAL' && <Lock className="h-3 w-3" />}{sec.label}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Lịch sử mượn" onClick={() => fetchDetail(m)}><History className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" disabled={m.quantityAvailable <= 0} onClick={() => { setIssueTarget(m); setLoanForm(emptyLoan); setIssueOpen(true); }}>Cấp phát</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      {detail && (
        <Card className="border-emerald-200">
          <CardHeader><CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><History className="h-5 w-5 text-emerald-600" /> Lịch sử mượn — <span className="font-mono">{detail.code}</span></span>
            <Button variant="ghost" size="icon" onClick={() => setDetail(null)}><X className="h-4 w-4" /></Button>
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            {loans.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Chưa có phiếu mượn</div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>SL</TableHead><TableHead>Hình thức</TableHead><TableHead>Người/đơn vị nhận</TableHead><TableHead>Ngày cấp</TableHead><TableHead>Hạn trả</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {loans.map(loan => {
                    const st = LOAN_STATUS_LABELS[loan.status] ?? { label: loan.status, cls: 'bg-gray-100' };
                    return (
                      <TableRow key={loan.id}>
                        <TableCell>{loan.quantity}</TableCell>
                        <TableCell className="text-sm">{loan.loanType === 'ALLOCATION' ? 'Cấp hẳn' : 'Cho mượn'}</TableCell>
                        <TableCell className="text-sm">{loan.borrowerName ?? loan.borrowerUnitId ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(loan.issuedAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('vi-VN') : '—'}</TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span></TableCell>
                        <TableCell className="text-right">
                          {loan.status === 'ISSUED' && loan.loanType === 'LOAN' && (
                            <Button size="sm" variant="ghost" onClick={() => handleReturn(detail.id, loan.id)}><Undo2 className="h-3.5 w-3.5 mr-1" /> Thu hồi</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm bản đồ</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Mã *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="BD-001" /></div>
              <div className="space-y-1.5"><Label>Số hiệu mảnh</Label><Input value={form.sheetNumber} onChange={e => setForm({ ...form, sheetNumber: e.target.value })} placeholder="F-48-..." /></div>
            </div>
            <div className="space-y-1.5"><Label>Tên *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Loại</Label>
                <Select value={form.mapType} onValueChange={v => setForm({ ...form, mapType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(MAP_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Định dạng</Label>
                <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(FORMAT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Tỉ lệ</Label><Input value={form.scale} onChange={e => setForm({ ...form, scale: e.target.value })} placeholder="1:50000" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Cấp độ mật</Label>
                <Select value={form.securityLevel} onValueChange={v => setForm({ ...form, securityLevel: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{securityOptions.map(v => <SelectItem key={v} value={v}>{SECURITY_LABELS[v].label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Số lượng</Label><Input type="number" min={0} value={form.quantityTotal} onChange={e => setForm({ ...form, quantityTotal: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Vị trí</Label><Input value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })} placeholder="Kho bản đồ" /></div>
            </div>
            {!canSecret && <p className="text-xs text-muted-foreground">Chỉ tạo được bản đồ mức "Thường" — cần quyền bản đồ mật để chọn mức cao hơn.</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button><Button onClick={handleCreate}>Thêm</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cấp phát / cho mượn — {issueTarget?.code}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">Tồn khả dụng: <span className="font-medium text-foreground">{issueTarget?.quantityAvailable}</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Số lượng</Label><Input type="number" min={1} max={issueTarget?.quantityAvailable} value={loanForm.quantity} onChange={e => setLoanForm({ ...loanForm, quantity: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Hình thức</Label>
                <Select value={loanForm.loanType} onValueChange={v => setLoanForm({ ...loanForm, loanType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOAN">Cho mượn (có thu hồi)</SelectItem><SelectItem value="ALLOCATION">Cấp hẳn</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Người/đơn vị nhận</Label><Input value={loanForm.borrowerName} onChange={e => setLoanForm({ ...loanForm, borrowerName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Mục đích</Label><Input value={loanForm.purpose} onChange={e => setLoanForm({ ...loanForm, purpose: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Hạn trả</Label><Input type="date" value={loanForm.dueDate} onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueOpen(false)}>Hủy</Button><Button onClick={handleIssue}>Cấp phát</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
