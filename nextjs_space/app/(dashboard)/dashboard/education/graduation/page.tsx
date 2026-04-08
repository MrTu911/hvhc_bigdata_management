/**
 * M10 – UC-60: Graduation Rule Engine – Xét tốt nghiệp
 * /dashboard/education/graduation
 *
 * RỦI RO CAO: Engine kết quả trực tiếp ảnh hưởng văn bằng pháp lý.
 * Không được để logic xét tốt nghiệp nằm trong UI.
 * UAT bắt buộc trước go-live.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  GraduationCap, Search, ChevronLeft, ChevronRight,
  PlayCircle, Download, AlertTriangle, CheckCircle2, XCircle,
  Shield, RefreshCw,
} from 'lucide-react';

// ============= CONSTANTS =============

const AUDIT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Chờ xét',          className: 'bg-gray-100 text-gray-700'    },
  ELIGIBLE:   { label: 'Đủ điều kiện',     className: 'bg-green-100 text-green-700'  },
  INELIGIBLE: { label: 'Chưa đủ điều kiện', className: 'bg-red-100 text-red-700'     },
  APPROVED:   { label: 'Đã duyệt TN',      className: 'bg-blue-100 text-blue-700'    },
  REJECTED:   { label: 'Từ chối',          className: 'bg-orange-100 text-orange-700' },
};

const FAILURE_REASON_LABELS: Record<string, string> = {
  INSUFFICIENT_CREDITS: 'Thiếu tín chỉ',
  LOW_GPA:              'GPA chưa đạt',
  CONDUCT_INELIGIBLE:   'Rèn luyện chưa đạt',
  THESIS_NOT_DEFENDED:  'Chưa bảo vệ khóa luận',
  LANGUAGE_INELIGIBLE:  'Ngoại ngữ chưa đạt',
};

// ============= TYPES =============

interface FailureReason { code: string; message: string }

interface AuditItem {
  id: string;
  hocVienId: string;
  auditDate: string;
  totalCreditsEarned: number | null;
  gpa: number | null;
  conductEligible: boolean;
  thesisEligible: boolean;
  languageEligible: boolean;
  graduationEligible: boolean;
  failureReasonsJson: FailureReason[] | null;
  status: string;
  decisionNo: string | null;
  notes: string | null;
  hocVien: { id: string; maHocVien: string; hoTen: string; lop: string | null; khoaHoc: string | null };
  diplomaRecord: { id: string; diplomaNo: string | null; diplomaType: string; graduationDate: string | null } | null;
}

// ============= PAGE =============

export default function GraduationPage() {
  const [items, setItems]     = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const limit = 20;

  // Filters
  const [filterEligible, setFilterEligible] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [search, setSearch]                 = useState('');

  // Run engine dialog
  const [runDialogOpen, setRunDialogOpen]     = useState(false);
  const [runHocVienId, setRunHocVienId]       = useState('');
  const [runHocVienSearch, setRunHocVienSearch] = useState('');
  const [runStudents, setRunStudents]           = useState<{ id: string; maHocVien: string; hoTen: string }[]>([]);
  const [runNotes, setRunNotes]                 = useState('');
  const [running, setRunning]                   = useState(false);
  const [lastRunResult, setLastRunResult]       = useState<AuditItem | null>(null);

  // Selection for export
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Exporting
  const [exporting, setExporting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterEligible) params.set('graduationEligible', filterEligible);
      if (filterStatus)   params.set('status', filterStatus);

      const res = await fetch(`/api/education/graduation/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) { setItems(data.data); setTotal(data.meta.total); }
      }
    } catch { toast.error('Không thể tải danh sách xét tốt nghiệp'); }
    finally  { setLoading(false); }
  }, [page, filterEligible, filterStatus]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const searchStudents = async (q: string) => {
    if (!q || q.length < 2) { setRunStudents([]); return; }
    try {
      const res = await fetch(`/api/education/students?search=${encodeURIComponent(q)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setRunStudents(data.data || []);
      }
    } catch { /* silent */ }
  };

  // ── Run engine ────────────────────────────────────────────────────────────

  const handleRunEngine = async () => {
    if (!runHocVienId) { toast.error('Chọn học viên trước khi chạy engine'); return; }

    const confirmed = window.confirm(
      '⚠️ Xác nhận chạy Graduation Rule Engine?\n\n' +
      'Kết quả sẽ được ghi vào hệ thống và ảnh hưởng đến quyết định cấp văn bằng.\n' +
      'Chỉ chạy khi dữ liệu học viên đã đầy đủ và chính xác.'
    );
    if (!confirmed) return;

    try {
      setRunning(true);
      const res = await fetch('/api/education/graduation/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hocVienId: runHocVienId, notes: runNotes || null }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLastRunResult(data.data);
        toast.success('Đã chạy xét tốt nghiệp');
        fetchItems();
      } else {
        toast.error(data.error || 'Lỗi chạy engine');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally   { setRunning(false); }
  };

  const resetRunDialog = () => {
    setRunHocVienId('');
    setRunHocVienSearch('');
    setRunStudents([]);
    setRunNotes('');
    setLastRunResult(null);
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    const ids = selected.size > 0 ? [...selected] : items.filter(i => i.graduationEligible).map(i => i.id);
    if (ids.length === 0) { toast.error('Không có bản ghi nào để xuất'); return; }

    try {
      setExporting(true);
      const res = await fetch('/api/education/graduation/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditIds: ids, format: 'XLSX' }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Lỗi xuất file'); return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-sach-tot-nghiep-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${ids.length} bản ghi`);
    } catch { toast.error('Lỗi xuất file'); }
    finally   { setExporting(false); }
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) =>
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = () =>
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i.id)));

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  const filtered = search
    ? items.filter(i =>
        i.hocVien.hoTen.toLowerCase().includes(search.toLowerCase()) ||
        i.hocVien.maHocVien.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const eligibleCount   = items.filter(i => i.graduationEligible).length;
  const ineligibleCount = items.filter(i => !i.graduationEligible).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Xét tốt nghiệp</h1>
          <p className="text-muted-foreground">Graduation Rule Engine – kết quả xét điều kiện tốt nghiệp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Xuất XLSX {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
          <Button onClick={() => { resetRunDialog(); setRunDialogOpen(true); }}>
            <PlayCircle className="h-4 w-4 mr-2" /> Chạy xét TN
          </Button>
        </div>
      </div>

      {/* Risk banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
        <div>
          <strong>Lưu ý quan trọng:</strong> Kết quả xét tốt nghiệp ảnh hưởng trực tiếp đến việc cấp văn bằng pháp lý.
          Chỉ chạy engine khi dữ liệu học viên (tín chỉ, GPA, rèn luyện, khóa luận) đã được xác nhận đầy đủ.
          <br />
          <span className="text-amber-600">Điều kiện ngoại ngữ hiện đang được bỏ qua (placeholder) — tích hợp M02 sau.</span>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đã xét',       value: total,          cls: 'text-foreground' },
          { label: 'Đủ điều kiện',      value: eligibleCount,  cls: 'text-green-600'  },
          { label: 'Chưa đủ điều kiện', value: ineligibleCount, cls: 'text-red-600'   },
          { label: 'Đã chọn',           value: selected.size,  cls: 'text-blue-600'   },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <div className={`text-3xl font-bold ${k.cls}`}>{k.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Tìm tên, mã học viên..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterEligible || '__ALL__'} onValueChange={v => { setFilterEligible(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kết quả" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả kết quả</SelectItem>
                <SelectItem value="true">Đủ điều kiện</SelectItem>
                <SelectItem value="false">Chưa đủ điều kiện</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus || '__ALL__'} onValueChange={v => { setFilterStatus(v === '__ALL__' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {Object.entries(AUDIT_STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <GraduationCap className="h-8 w-8 opacity-30" />
              <span>Chưa có kết quả xét tốt nghiệp</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === items.length && items.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Ngày xét</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Tín chỉ</TableHead>
                  <TableHead>Điều kiện</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Lý do chưa đạt</TableHead>
                  <TableHead>Văn bằng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const reasons = (item.failureReasonsJson ?? []) as FailureReason[];
                  const statusCfg = AUDIT_STATUS_CONFIG[item.status];
                  return (
                    <TableRow key={item.id} className={selected.has(item.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{item.hocVien.hoTen}</div>
                        <div className="text-xs text-muted-foreground">{item.hocVien.maHocVien} · {item.hocVien.lop ?? '—'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.auditDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${(item.gpa ?? 0) >= 2.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.gpa?.toFixed(2) ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{item.totalCreditsEarned ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <ConditionDot ok={item.conductEligible}  label="Rèn luyện" />
                          <ConditionDot ok={item.thesisEligible}   label="Khóa luận" />
                          <ConditionDot ok={item.languageEligible} label="Ngoại ngữ" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {item.graduationEligible ? (
                            <Badge className="bg-green-100 text-green-700 w-fit flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Đủ điều kiện
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 w-fit flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Chưa đủ
                            </Badge>
                          )}
                          <Badge className={`${statusCfg?.className} w-fit text-xs`}>
                            {statusCfg?.label ?? item.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[180px]">
                        {reasons.length > 0 ? (
                          <ul className="space-y-0.5">
                            {reasons.map((r, i) => (
                              <li key={i}>• {FAILURE_REASON_LABELS[r.code] ?? r.message}</li>
                            ))}
                          </ul>
                        ) : <span className="text-green-600">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.diplomaRecord ? (
                          <div>
                            <div className="font-medium">{item.diplomaRecord.diplomaNo ?? 'Chưa số'}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.diplomaRecord.graduationDate
                                ? new Date(item.diplomaRecord.graduationDate).toLocaleDateString('vi-VN')
                                : '—'}
                            </div>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page}/{totalPages} ({total} bản ghi)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Run Engine Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={open => { setRunDialogOpen(open); if (!open) resetRunDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" /> Chạy Graduation Rule Engine
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-800">
              Kết quả sẽ được lưu vĩnh viễn. Đảm bảo dữ liệu học viên đã hoàn chỉnh trước khi chạy.
            </div>

            <div className="space-y-2">
              <Label>Tìm học viên *</Label>
              <Input
                placeholder="Nhập tên hoặc mã học viên..."
                value={runHocVienSearch}
                onChange={e => { setRunHocVienSearch(e.target.value); searchStudents(e.target.value); }}
              />
              {runStudents.length > 0 && (
                <Select value={runHocVienId} onValueChange={v => setRunHocVienId(v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn học viên" /></SelectTrigger>
                  <SelectContent>
                    {runStudents.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.maHocVien} – {s.hoTen}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {runHocVienId && (
                <p className="text-xs text-green-600">✓ Đã chọn: {runStudents.find(s => s.id === runHocVienId)?.hoTen ?? runHocVienId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ghi chú (tuỳ chọn)</Label>
              <Input value={runNotes} onChange={e => setRunNotes(e.target.value)} placeholder="VD: Xét đợt tháng 6/2026" />
            </div>

            {/* Engine result preview */}
            {lastRunResult && (
              <div className={`p-3 rounded-md border text-sm ${
                lastRunResult.graduationEligible
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                <div className="font-medium mb-1">
                  {lastRunResult.graduationEligible ? '✓ Đủ điều kiện tốt nghiệp' : '✗ Chưa đủ điều kiện'}
                </div>
                <div className="text-xs space-y-0.5">
                  <div>GPA: {lastRunResult.gpa?.toFixed(2)} · Tín chỉ: {lastRunResult.totalCreditsEarned}</div>
                  {((lastRunResult.failureReasonsJson ?? []) as FailureReason[]).map((r, i) => (
                    <div key={i}>• {FAILURE_REASON_LABELS[r.code] ?? r.message}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>Đóng</Button>
            <Button
              onClick={handleRunEngine}
              disabled={running || !runHocVienId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {running ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {running ? 'Đang chạy...' : 'Xác nhận & Chạy Engine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper component ──────────────────────────────────────────────────────────

function ConditionDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${ok ? 'Đạt' : 'Chưa đạt'}`}
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full
        ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}
