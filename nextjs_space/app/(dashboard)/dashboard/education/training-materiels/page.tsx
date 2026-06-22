/**
 * M10 – Phase 3: Trang Vật chất huấn luyện (Ban Vật chất).
 * Danh sách kho + cấp phát/mượn-trả. Permission-aware (nút theo quyền backend).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Archive, PackageOpen, Boxes, Undo2, X, History,
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

const CATEGORY_LABELS: Record<string, string> = {
  WEAPON_MODEL: 'Mô hình/vũ khí HL', EQUIPMENT: 'Khí tài/trang bị', FIELD_GEAR: 'Trang bị dã ngoại',
  SIMULATOR: 'Thiết bị mô phỏng', AMMUNITION_MODEL: 'Mô hình đạn dược', CONSUMABLE: 'Vật tư tiêu hao', OTHER: 'Khác',
};
const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Mới', GOOD: 'Tốt', USABLE: 'Dùng được', DAMAGED: 'Hư hỏng', RETIRED: 'Loại biên',
};
const ISSUE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ISSUED: { label: 'Đang mượn', cls: 'bg-blue-100 text-blue-700' },
  RETURNED: { label: 'Đã trả', cls: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Quá hạn', cls: 'bg-red-100 text-red-700' },
  LOST: { label: 'Mất', cls: 'bg-gray-200 text-gray-700' },
};

interface Materiel {
  id: string; code: string; name: string; category: string;
  measureUnit: string | null; quantityTotal: number; quantityAvailable: number;
  condition: string; storageLocation: string | null; _count?: { issuances: number };
}
interface Issuance {
  id: string; quantity: number; issueType: string; borrowerName: string | null;
  borrowerUnitId: string | null; purpose: string | null; issuedAt: string;
  dueDate: string | null; returnedAt: string | null; status: string;
}

const emptyForm = { code: '', name: '', category: 'EQUIPMENT', measureUnit: 'cái', quantityTotal: 0, condition: 'GOOD', storageLocation: '' };
const emptyIssue = { quantity: 1, issueType: 'LOAN', borrowerName: '', purpose: '', dueDate: '' };

export default function TrainingMaterielPage() {
  const [items, setItems] = useState<Materiel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<Materiel | null>(null);
  const [issueForm, setIssueForm] = useState(emptyIssue);

  const [detail, setDetail] = useState<Materiel | null>(null);
  const [issuances, setIssuances] = useState<Issuance[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      const res = await fetch(`/api/education/training-materiels?${params}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
      } else {
        toast.error(data.error || 'Không tải được kho vật chất');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [search, filterCategory]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const fetchDetail = useCallback(async (m: Materiel) => {
    setDetail(m);
    try {
      const res = await fetch(`/api/education/training-materiels/${m.id}`);
      const data = await res.json();
      if (res.ok && data.success) setIssuances(data.data.issuances || []);
      else setIssuances([]);
    } catch { setIssuances([]); }
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.name) { toast.error('Mã và tên là bắt buộc'); return; }
    try {
      const res = await fetch('/api/education/training-materiels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantityTotal: Number(form.quantityTotal) }),
      });
      const data = await res.json();
      if (res.ok && data.success) { toast.success('Đã thêm vật chất'); setCreateOpen(false); setForm(emptyForm); fetchItems(); }
      else toast.error(data.error || 'Lỗi tạo');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleIssue = async () => {
    if (!issueTarget) return;
    if (Number(issueForm.quantity) <= 0) { toast.error('Số lượng phải > 0'); return; }
    try {
      const res = await fetch(`/api/education/training-materiels/${issueTarget.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue', ...issueForm, quantity: Number(issueForm.quantity) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã cấp phát');
        setIssueOpen(false); setIssueForm(emptyIssue); fetchItems();
        if (detail?.id === issueTarget.id) fetchDetail(issueTarget);
      } else toast.error(data.error || 'Lỗi cấp phát');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleReturn = async (materielId: string, issuanceId: string) => {
    try {
      const res = await fetch(`/api/education/training-materiels/${materielId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return', issuanceId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Đã thu hồi'); fetchItems();
        if (detail) fetchDetail(detail);
      } else toast.error(data.error || 'Lỗi thu hồi');
    } catch { toast.error('Lỗi kết nối'); }
  };

  const totalAvailable = items.reduce((s, m) => s + m.quantityAvailable, 0);
  const totalIssued = items.reduce((s, m) => s + (m.quantityTotal - m.quantityAvailable), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="h-6 w-6 text-amber-700" /> Vật chất huấn luyện</h1>
          <p className="text-muted-foreground">Ban Vật chất — quản lý kho & cấp phát/mượn-trả vật chất huấn luyện</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Thêm vật chất</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-stone-100"><Boxes className="h-5 w-5 text-stone-600" /></div><div><p className="text-xs text-muted-foreground">Đầu mục vật chất</p><p className="text-2xl font-bold">{total}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100"><PackageOpen className="h-5 w-5 text-green-600" /></div><div><p className="text-xs text-muted-foreground">Tồn khả dụng</p><p className="text-2xl font-bold text-green-600">{totalAvailable}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100"><Undo2 className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-muted-foreground">Đang cấp phát</p><p className="text-2xl font-bold text-blue-600">{totalIssued}</p></div></CardContent></Card>
      </div>

      <Card><CardContent className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Tìm theo mã, tên..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory || '__ALL__'} onValueChange={v => setFilterCategory(v === '__ALL__' ? '' : v)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Loại" /></SelectTrigger>
          <SelectContent><SelectItem value="__ALL__">Tất cả loại</SelectItem>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchItems}><RefreshCw className="h-4 w-4" /></Button>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Mã</TableHead><TableHead>Tên</TableHead><TableHead>Loại</TableHead>
            <TableHead className="text-center">Khả dụng/Tổng</TableHead><TableHead>Tình trạng</TableHead>
            <TableHead>Vị trí</TableHead><TableHead className="text-right">Thao tác</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Chưa có vật chất nào</TableCell></TableRow>
            ) : items.map(m => (
              <TableRow key={m.id} className={detail?.id === m.id ? 'bg-amber-50' : ''}>
                <TableCell className="font-mono text-sm font-medium">{m.code}</TableCell>
                <TableCell className="text-sm">{m.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{CATEGORY_LABELS[m.category] ?? m.category}</TableCell>
                <TableCell className="text-center"><Badge variant="outline">{m.quantityAvailable}/{m.quantityTotal} {m.measureUnit ?? ''}</Badge></TableCell>
                <TableCell className="text-sm">{CONDITION_LABELS[m.condition] ?? m.condition}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.storageLocation ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Lịch sử cấp phát" onClick={() => fetchDetail(m)}><History className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" disabled={m.quantityAvailable <= 0} onClick={() => { setIssueTarget(m); setIssueForm(emptyIssue); setIssueOpen(true); }}>Cấp phát</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Detail / issuance history */}
      {detail && (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><History className="h-5 w-5 text-amber-600" /> Lịch sử cấp phát — <span className="font-mono">{detail.code}</span></span>
            <Button variant="ghost" size="icon" onClick={() => setDetail(null)}><X className="h-4 w-4" /></Button>
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            {issuances.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Chưa có phiếu cấp phát</div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>SL</TableHead><TableHead>Hình thức</TableHead><TableHead>Người/đơn vị nhận</TableHead><TableHead>Ngày cấp</TableHead><TableHead>Hạn trả</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {issuances.map(iss => {
                    const st = ISSUE_STATUS_LABELS[iss.status] ?? { label: iss.status, cls: 'bg-gray-100' };
                    return (
                      <TableRow key={iss.id}>
                        <TableCell>{iss.quantity}</TableCell>
                        <TableCell className="text-sm">{iss.issueType === 'ALLOCATION' ? 'Cấp hẳn' : 'Cho mượn'}</TableCell>
                        <TableCell className="text-sm">{iss.borrowerName ?? iss.borrowerUnitId ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(iss.issuedAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{iss.dueDate ? new Date(iss.dueDate).toLocaleDateString('vi-VN') : '—'}</TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span></TableCell>
                        <TableCell className="text-right">
                          {iss.status === 'ISSUED' && iss.issueType === 'LOAN' && (
                            <Button size="sm" variant="ghost" onClick={() => handleReturn(detail.id, iss.id)}><Undo2 className="h-3.5 w-3.5 mr-1" /> Thu hồi</Button>
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
          <DialogHeader><DialogTitle>Thêm vật chất huấn luyện</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Mã *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VC-001" /></div>
              <div className="space-y-1.5"><Label>Đơn vị tính</Label><Input value={form.measureUnit} onChange={e => setForm({ ...form, measureUnit: e.target.value })} placeholder="cái/bộ/khẩu" /></div>
            </div>
            <div className="space-y-1.5"><Label>Tên *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Loại</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Tình trạng</Label>
                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CONDITION_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Số lượng</Label><Input type="number" min={0} value={form.quantityTotal} onChange={e => setForm({ ...form, quantityTotal: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Vị trí cất giữ</Label><Input value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })} placeholder="Kho A" /></div>
            </div>
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
              <div className="space-y-1.5"><Label>Số lượng</Label><Input type="number" min={1} max={issueTarget?.quantityAvailable} value={issueForm.quantity} onChange={e => setIssueForm({ ...issueForm, quantity: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Hình thức</Label>
                <Select value={issueForm.issueType} onValueChange={v => setIssueForm({ ...issueForm, issueType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOAN">Cho mượn (có thu hồi)</SelectItem><SelectItem value="ALLOCATION">Cấp hẳn</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Người/đơn vị nhận</Label><Input value={issueForm.borrowerName} onChange={e => setIssueForm({ ...issueForm, borrowerName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Mục đích</Label><Input value={issueForm.purpose} onChange={e => setIssueForm({ ...issueForm, purpose: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Hạn trả</Label><Input type="date" value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueOpen(false)}>Hủy</Button><Button onClick={handleIssue}>Cấp phát</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
