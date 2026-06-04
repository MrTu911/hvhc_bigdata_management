'use client';

/**
 * Admin — Graduation Audit Management
 * /dashboard/admin/education/graduation-audits
 *
 * Cho phép admin xem, phê duyệt, từ chối GraduationAudit,
 * chạy batch audit, và cấp bằng tốt nghiệp.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  GraduationCap, Search, PlayCircle, CheckCircle2, XCircle,
  Award, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ===== CONSTANTS =====

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  PENDING:    { label: 'Chờ xét',           variant: 'secondary' },
  ELIGIBLE:   { label: 'Đủ điều kiện',      variant: 'default'   },
  INELIGIBLE: { label: 'Chưa đủ điều kiện', variant: 'destructive' },
  APPROVED:   { label: 'Đã duyệt TN',       variant: 'default'   },
  REJECTED:   { label: 'Từ chối',           variant: 'destructive' },
};

interface AuditItem {
  id: string;
  hocVienId: string;
  auditDate: string;
  gpa: number;
  totalCreditsEarned: number;
  graduationEligible: boolean;
  status: string;
  decisionNo: string | null;
  notes: string | null;
  hocVien: { maHocVien: string; hoTen: string; lop: string; khoaHoc: string };
  diplomaRecord: { diplomaNo: string } | null;
}

interface Meta { total: number; page: number; totalPages: number }

// ===== DIALOGS =====

function ApproveDialog({
  auditId,
  open,
  onClose,
  onSuccess,
}: {
  auditId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [decisionNo, setDecisionNo] = useState('');
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);

  async function handleApprove() {
    if (!decisionNo.trim()) { toast.error('Vui lòng nhập số quyết định'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/education/graduation/audit/${auditId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNo, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã phê duyệt tốt nghiệp');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Phê duyệt thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Phê duyệt tốt nghiệp</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="decisionNo">Số quyết định *</Label>
            <Input id="decisionNo" value={decisionNo} onChange={e => setDecisionNo(e.target.value)}
              placeholder="VD: QĐ-2026-001" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="notes">Ghi chú</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chú thêm (tuỳ chọn)" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Phê duyệt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  auditId,
  open,
  onClose,
  onSuccess,
}: {
  auditId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading]           = useState(false);

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/education/graduation/audit/${auditId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã từ chối');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Từ chối thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Từ chối xét tốt nghiệp</DialogTitle></DialogHeader>
        <div className="py-2">
          <Label htmlFor="rejectReason">Lý do từ chối *</Label>
          <Input id="rejectReason" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Nêu rõ lý do..." className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueDiplomaDialog({
  auditId,
  open,
  onClose,
  onSuccess,
}: {
  auditId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [diplomaType, setDiplomaType]     = useState('dai_hoc');
  const [classification, setClassification] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [loading, setLoading]             = useState(false);

  async function handleIssue() {
    if (!graduationDate) { toast.error('Vui lòng chọn ngày tốt nghiệp'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/education/graduation/diploma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, diplomaType, classification, graduationDate }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Đã cấp bằng: ${data.data.diplomaNo}`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Cấp bằng thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Cấp bằng tốt nghiệp</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Loại bằng *</Label>
            <Select value={diplomaType} onValueChange={setDiplomaType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dai_hoc">Đại học</SelectItem>
                <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                <SelectItem value="chung_chi">Chứng chỉ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Xếp loại</Label>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn xếp loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Xuất sắc">Xuất sắc</SelectItem>
                <SelectItem value="Giỏi">Giỏi</SelectItem>
                <SelectItem value="Khá">Khá</SelectItem>
                <SelectItem value="Trung bình">Trung bình</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gradDate">Ngày tốt nghiệp *</Label>
            <Input id="gradDate" type="date" value={graduationDate}
              onChange={e => setGraduationDate(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleIssue} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Cấp bằng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN PAGE =====

export default function GraduationAuditsAdminPage() {
  const [audits, setAudits]     = useState<AuditItem[]>([]);
  const [meta, setMeta]         = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]   = useState(false);
  const [keyword, setKeyword]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

  const [approveId, setApproveId]     = useState<string | null>(null);
  const [rejectId, setRejectId]       = useState<string | null>(null);
  const [diplomaId, setDiplomaId]     = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (keyword.trim()) params.set('keyword', keyword.trim());

      const res = await fetch(`/api/education/graduation/audit?${params}`);
      const data = await res.json();
      if (data.success) {
        setAudits(data.data);
        setMeta(data.meta);
      }
    } catch {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, keyword]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  async function handleBatchRun() {
    setBatchRunning(true);
    try {
      const res = await fetch('/api/education/graduation/batch-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortFilter: {} }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const { total, eligible, ineligible, skipped, errors } = data.data;
      toast.success(`Batch hoàn thành: ${eligible} đủ điều kiện, ${ineligible} chưa đủ, ${skipped} bỏ qua, ${errors.length} lỗi / ${total} học viên`);
      fetchAudits();
    } catch (e: any) {
      toast.error(e.message || 'Batch audit thất bại');
    } finally {
      setBatchRunning(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold">Quản lý xét tốt nghiệp</h1>
            <p className="text-sm text-muted-foreground">
              Phê duyệt, từ chối và cấp bằng tốt nghiệp
            </p>
          </div>
        </div>
        <Button onClick={handleBatchRun} disabled={batchRunning} variant="outline">
          {batchRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4 mr-2" />
          )}
          Chạy batch xét tốt nghiệp
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm theo tên, mã học viên..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Danh sách ({meta.total} kết quả)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground">Đang tải...</div>
          ) : audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <GraduationCap className="h-10 w-10 opacity-30" />
              <p>Không có dữ liệu xét tốt nghiệp</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Lớp / Khóa</TableHead>
                  <TableHead className="text-right">GPA</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số QĐ</TableHead>
                  <TableHead>Bằng</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => {
                  const statusCfg = STATUS_CONFIG[audit.status] ?? { label: audit.status, variant: 'secondary' };
                  return (
                    <TableRow key={audit.id}>
                      <TableCell>
                        <div className="font-medium">{audit.hocVien.hoTen}</div>
                        <div className="text-xs text-muted-foreground">{audit.hocVien.maHocVien}</div>
                      </TableCell>
                      <TableCell>
                        <div>{audit.hocVien.lop}</div>
                        <div className="text-xs text-muted-foreground">{audit.hocVien.khoaHoc}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {audit.gpa?.toFixed(2) ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{audit.decisionNo ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {audit.diplomaRecord ? (
                          <span className="text-green-600 font-medium">{audit.diplomaRecord.diplomaNo}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {audit.status === 'ELIGIBLE' && (
                            <>
                              <Button size="sm" variant="outline"
                                onClick={() => setApproveId(audit.id)}
                                title="Phê duyệt">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="outline"
                                onClick={() => setRejectId(audit.id)}
                                title="Từ chối">
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {audit.status === 'APPROVED' && !audit.diplomaRecord && (
                            <Button size="sm" variant="outline"
                              onClick={() => setDiplomaId(audit.id)}
                              title="Cấp bằng">
                              <Award className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
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
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {approveId && (
        <ApproveDialog
          auditId={approveId}
          open={!!approveId}
          onClose={() => setApproveId(null)}
          onSuccess={fetchAudits}
        />
      )}
      {rejectId && (
        <RejectDialog
          auditId={rejectId}
          open={!!rejectId}
          onClose={() => setRejectId(null)}
          onSuccess={fetchAudits}
        />
      )}
      {diplomaId && (
        <IssueDiplomaDialog
          auditId={diplomaId}
          open={!!diplomaId}
          onClose={() => setDiplomaId(null)}
          onSuccess={fetchAudits}
        />
      )}
    </div>
  );
}
