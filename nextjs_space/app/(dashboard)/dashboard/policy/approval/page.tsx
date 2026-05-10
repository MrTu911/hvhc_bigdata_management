'use client';

/**
 * /dashboard/policy/approval
 * Quản lý CSDL chính sách — xét duyệt yêu cầu chế độ chính sách cán bộ.
 * RBAC: POLICY.APPROVE
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2, XCircle, Clock, Eye, Loader2, FileText, AlertCircle,
  Send, RotateCcw, RefreshCw, Search, Filter, X, ChevronDown,
  User, Building2, Banknote,
  History, ArrowUpRight, ShieldCheck, Inbox,
  ChevronLeft, ChevronRightIcon, ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Requester {
  id: string;
  name: string;
  email: string;
  rank: string | null;
  position: string | null;
  unit: string | null;
  department: string | null;
}

interface WorkflowLog {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  performedBy: string;
  performerName: string | null;
  performerRole: string | null;
  note: string | null;
  createdAt: string;
}

interface PolicyRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  reason: string | null;
  requestedAmount: number | null;
  approvedAmount: number | null;
  currency: string;
  status: string;
  currentLevel: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  approverNote: string | null;
  rejectReason: string | null;
  createdAt: string;
  requester: Requester;
  category: { id: string; code: string; name: string; requiresApproval: boolean; approvalLevels: number };
  attachments: { id: string; fileName: string; fileType: string; fileSize: number }[];
  _count?: { workflowLogs: number };
  workflowLogs?: WorkflowLog[];
}

interface SummaryStats {
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  total: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; bg: string; text: string; border: string; dot: string; icon: React.ElementType;
}> = {
  DRAFT:        { label: 'Nháp',           bg: 'bg-slate-100',   text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400',   icon: FileText },
  SUBMITTED:    { label: 'Chờ xét duyệt',  bg: 'bg-blue-50',     text: 'text-blue-700',  border: 'border-blue-200',  dot: 'bg-blue-500',    icon: Inbox },
  UNDER_REVIEW: { label: 'Đang xét duyệt', bg: 'bg-amber-50',    text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500',   icon: Clock },
  APPROVED:     { label: 'Đã duyệt',       bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  REJECTED:     { label: 'Từ chối',        bg: 'bg-red-50',      text: 'text-red-700',   border: 'border-red-200',   dot: 'bg-red-500',     icon: XCircle },
  CANCELLED:    { label: 'Đã hủy',         bg: 'bg-slate-50',    text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-300',   icon: X },
  COMPLETED:    { label: 'Hoàn thành',     bg: 'bg-teal-50',     text: 'text-teal-700',  border: 'border-teal-200',  dot: 'bg-teal-500',    icon: ClipboardCheck },
};

const ACTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
  CREATE:   { label: 'Tạo hồ sơ',         color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
  UPDATE:   { label: 'Cập nhật',           color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
  SUBMIT:   { label: 'Gửi yêu cầu',       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  REVIEW:   { label: 'Trả lại bổ sung',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  APPROVE:  { label: 'Phê duyệt',         color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  REJECT:   { label: 'Từ chối',           color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  CANCEL:   { label: 'Hủy yêu cầu',       color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200' },
  COMPLETE: { label: 'Hoàn thành',        color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200' },
};

const TABS = [
  { key: 'pending',     label: 'Chờ xét duyệt', status: 'SUBMITTED',    icon: Inbox },
  { key: 'in_review',   label: 'Đang xét',      status: 'UNDER_REVIEW', icon: Clock },
  { key: 'approved',    label: 'Đã duyệt',      status: 'APPROVED',     icon: CheckCircle2 },
  { key: 'rejected',    label: 'Từ chối',       status: 'REJECTED',     icon: XCircle },
  { key: 'all',         label: 'Tất cả',        status: '',             icon: Filter },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDatetime(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(n: number | null | undefined) {
  if (!n) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function fmtRelative(s: string) {
  const mins = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (mins < 60) return `${mins} phút trước`;
  if (mins < 1440) return `${Math.floor(mins / 60)} giờ trước`;
  return `${Math.floor(mins / 1440)} ngày trước`;
}

// ─── StatusChip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.bg, cfg.text, cfg.border)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, gradient, onClick, active }: {
  label: string; value: number; sub?: string; icon: React.ElementType;
  gradient: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl p-4 transition-all duration-200 border-2',
        'hover:scale-[1.02] hover:shadow-lg',
        active ? 'border-white shadow-lg scale-[1.02]' : 'border-transparent',
        gradient
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-white/70 mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 rounded-xl bg-white/20">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {onClick && (
        <div className="flex items-center gap-1 mt-2 text-xs text-white/80">
          <span>Xem ngay</span>
          <ArrowUpRight className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

// ─── WorkflowTimeline ────────────────────────────────────────────────────────

function WorkflowTimeline({ logs }: { logs: WorkflowLog[] }) {
  const sorted = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="space-y-1">
      {sorted.map((log, idx) => {
        const isLatest = idx === sorted.length - 1;
        const aCfg = ACTION_CFG[log.action] ?? ACTION_CFG.UPDATE;
        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-3 h-3 rounded-full border-2 mt-1.5 flex-shrink-0',
                isLatest ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
              )} />
              {idx < sorted.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1 mb-1" style={{ minHeight: 16 }} />}
            </div>
            <div className={cn('flex-1 rounded-lg border p-2.5 mb-1.5 text-xs', aCfg.bg)}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={cn('font-semibold', aCfg.color)}>{aCfg.label}</span>
                <span className="text-muted-foreground">{fmtDatetime(log.createdAt)}</span>
              </div>
              {(log.performerName || log.performerRole) && (
                <p className="text-muted-foreground mt-0.5">
                  {log.performerName ?? 'Hệ thống'}
                  {log.performerRole ? ` · ${log.performerRole}` : ''}
                </p>
              )}
              {log.note && (
                <p className={cn('mt-1 italic', aCfg.color)}>"{log.note}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail Drawer (Dialog) ──────────────────────────────────────────────────

function DetailDialog({
  req, open, onClose, onAction,
}: {
  req: PolicyRequest | null;
  open: boolean;
  onClose: () => void;
  onAction: (id: string, action: string, note: string, amount?: number) => Promise<void>;
}) {
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REVIEW' | null>(null);
  const [note, setNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) { setActionType(null); setNote(''); setApprovedAmount(''); }
  }, [open]);

  if (!req) return null;

  const canAct = req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW';

  async function handleAction() {
    if (!actionType || !req) return;
    if (actionType === 'REJECT' && !note.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      await onAction(req.id, actionType, note.trim(), approvedAmount ? parseFloat(approvedAmount) : undefined);
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 rounded-t-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                {req.requestNumber}
              </code>
              <StatusChip status={req.status} />
              <Badge variant="outline" className="text-xs">{req.category.name}</Badge>
            </div>
            <DialogTitle className="text-base mt-2">{req.title}</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              Gửi ngày {fmtDate(req.submittedAt ?? req.createdAt)} · {req.workflowLogs?.length ?? req._count?.workflowLogs ?? 0} thao tác
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Requester info */}
          <div className="rounded-xl border bg-slate-50 p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Người yêu cầu</p>
                <p className="font-semibold">{req.requester.name}</p>
                {req.requester.rank && <p className="text-xs text-slate-500">{req.requester.rank}</p>}
                {req.requester.position && <p className="text-xs text-slate-500">{req.requester.position}</p>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Đơn vị</p>
                <p className="font-semibold">{req.requester.unit ?? '—'}</p>
                {req.requester.department && <p className="text-xs text-slate-500">{req.requester.department}</p>}
              </div>
            </div>
            {req.requestedAmount && (
              <div className="flex items-start gap-2">
                <Banknote className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Số tiền đề nghị</p>
                  <p className="font-semibold text-blue-700">{fmtCurrency(req.requestedAmount)}</p>
                </div>
              </div>
            )}
            {req.approvedAmount && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Số tiền đã duyệt</p>
                  <p className="font-semibold text-emerald-700">{fmtCurrency(req.approvedAmount)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Nội dung yêu cầu</p>
            <div className="rounded-lg border bg-white p-3 text-sm whitespace-pre-line text-slate-700">
              {req.description}
            </div>
          </div>

          {req.reason && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Căn cứ / Lý do</p>
              <div className="rounded-lg border bg-white p-3 text-sm text-slate-700">{req.reason}</div>
            </div>
          )}

          {/* Existing decision */}
          {req.status === 'REJECTED' && req.rejectReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Lý do từ chối
              </p>
              <p className="text-sm text-red-800">{req.rejectReason}</p>
              {req.rejectedAt && <p className="text-xs text-red-500 mt-1">{fmtDatetime(req.rejectedAt)}</p>}
            </div>
          )}
          {req.status === 'APPROVED' && req.approverNote && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ghi chú phê duyệt
              </p>
              <p className="text-sm text-emerald-800">{req.approverNote}</p>
              {req.approvedAt && <p className="text-xs text-emerald-500 mt-1">{fmtDatetime(req.approvedAt)}</p>}
            </div>
          )}

          {/* Attachments */}
          {req.attachments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Tài liệu đính kèm ({req.attachments.length})
              </p>
              <div className="space-y-1.5">
                {req.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs">
                    <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="flex-1 truncate font-medium">{att.fileName}</span>
                    <span className="text-muted-foreground">{(att.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow timeline */}
          {req.workflowLogs && req.workflowLogs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Lịch sử tiến trình
              </p>
              <WorkflowTimeline logs={req.workflowLogs} />
            </div>
          )}

          {/* Action panel */}
          {canAct && (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 space-y-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-blue-600" /> Quyết định xử lý
              </p>

              {/* Action buttons */}
              {!actionType && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setActionType('APPROVE')}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Phê duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => setActionType('REVIEW')}
                  >
                    <RotateCcw className="h-4 w-4" /> Trả lại bổ sung
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setActionType('REJECT')}
                  >
                    <XCircle className="h-4 w-4" /> Từ chối
                  </Button>
                </div>
              )}

              {/* APPROVE form */}
              {actionType === 'APPROVE' && (
                <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Phê duyệt yêu cầu
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setActionType(null)}>Hủy</Button>
                  </div>
                  {req.requestedAmount && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Số tiền duyệt (VNĐ)</Label>
                      <Input
                        type="number"
                        placeholder={req.requestedAmount.toString()}
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        className="text-sm h-8"
                      />
                      <p className="text-xs text-muted-foreground">Để trống = duyệt đúng số tiền đề nghị</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Ghi chú (tùy chọn)</Label>
                    <Textarea
                      rows={2}
                      placeholder="Ghi chú khi phê duyệt..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleAction}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Xác nhận phê duyệt
                  </Button>
                </div>
              )}

              {/* REVIEW form */}
              {actionType === 'REVIEW' && (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4" /> Trả lại bổ sung hồ sơ
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setActionType(null)}>Hủy</Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Yêu cầu bổ sung <span className="text-red-500">*</span></Label>
                    <Textarea
                      rows={3}
                      placeholder="Nêu rõ nội dung cần bổ sung / chỉnh sửa..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    className="w-full gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleAction}
                    disabled={processing || !note.trim()}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Trả lại cho cán bộ
                  </Button>
                </div>
              )}

              {/* REJECT form */}
              {actionType === 'REJECT' && (
                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Từ chối yêu cầu
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setActionType(null)}>Hủy</Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Lý do từ chối <span className="text-red-500">*</span></Label>
                    <Textarea
                      rows={3}
                      placeholder="Nêu rõ lý do từ chối yêu cầu này..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full gap-1.5"
                    onClick={handleAction}
                    disabled={processing || !note.trim()}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Xác nhận từ chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-slate-50 rounded-b-lg">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export default function PolicyApprovalPage() {
  const [requests, setRequests] = useState<PolicyRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<SummaryStats>({ submitted: 0, underReview: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedReq, setSelectedReq] = useState<PolicyRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch categories once
  useEffect(() => {
    fetch('/api/policy/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []));
  }, []);

  const fetchRequests = useCallback(async (silent = false, tabOverride?: string) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const status = tabOverride !== undefined
        ? TABS.find((t) => t.key === tabOverride)?.status ?? ''
        : TABS.find((t) => t.key === activeTab)?.status ?? '';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        ...(status && { status }),
        ...(search && { search }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
      });
      const res = await fetch(`/api/policy/requests?${params}`);
      const data = await res.json();
      setRequests(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, page, search, categoryFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const [s, u, a, r, tot] = await Promise.all([
        fetch('/api/policy/requests?status=SUBMITTED&limit=1').then((x) => x.json()),
        fetch('/api/policy/requests?status=UNDER_REVIEW&limit=1').then((x) => x.json()),
        fetch('/api/policy/requests?status=APPROVED&limit=1').then((x) => x.json()),
        fetch('/api/policy/requests?status=REJECTED&limit=1').then((x) => x.json()),
        fetch('/api/policy/requests?limit=1').then((x) => x.json()),
      ]);
      setStats({
        submitted: s.pagination?.total ?? 0,
        underReview: u.pagination?.total ?? 0,
        approved: a.pagination?.total ?? 0,
        rejected: r.pagination?.total ?? 0,
        total: tot.pagination?.total ?? 0,
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Reset page khi đổi tab/filter
  useEffect(() => { setPage(1); }, [activeTab, search, categoryFilter]);

  function goToPending() {
    if (activeTab === 'pending') {
      // Đang ở tab pending rồi → force reload + scroll
      fetchRequests(false, 'pending');
    } else {
      setActiveTab('pending');
    }
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  async function openDetail(req: PolicyRequest) {
    setSelectedReq(req);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/policy/requests/${req.id}`);
      const data = await res.json();
      // API trả thẳng object, guard nếu lỗi
      if (data?.id) setSelectedReq(data as PolicyRequest);
    } catch { /* giữ nguyên data từ list */ }
  }

  async function handleAction(id: string, action: string, note: string, approvedAmount?: number) {
    setActionLoading(id);
    try {
      const body: Record<string, unknown> = { action, note };
      if (approvedAmount !== undefined) body.approvedAmount = approvedAmount;
      const res = await fetch(`/api/policy/requests/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        const labels: Record<string, string> = {
          APPROVE: 'Đã phê duyệt thành công',
          REJECT: 'Đã từ chối yêu cầu',
          REVIEW: 'Đã trả lại cho cán bộ bổ sung',
        };
        toast.success(labels[action] ?? 'Thao tác thành công');
        await Promise.all([fetchRequests(true), fetchStats()]);
      } else {
        toast.error(data.error ?? 'Có lỗi xảy ra');
        throw new Error(data.error);
      }
    } finally {
      setActionLoading(null);
    }
  }

  const pendingTotal = stats.submitted + stats.underReview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Hero Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 shadow-lg shadow-blue-200">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Xét duyệt chính sách</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Quản lý và xử lý yêu cầu chế độ chính sách cán bộ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 bg-white"
              onClick={() => { fetchRequests(true); fetchStats(); }}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ── Urgent banner ── */}
        {pendingTotal > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center gap-3 shadow-md shadow-amber-200">
            <div className="p-2 rounded-xl bg-white/20 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                {pendingTotal} yêu cầu đang chờ xử lý
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                {stats.submitted > 0 && `${stats.submitted} yêu cầu mới chờ xét`}
                {stats.submitted > 0 && stats.underReview > 0 && ' · '}
                {stats.underReview > 0 && `${stats.underReview} đang trong quá trình xét duyệt`}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white text-orange-700 hover:bg-orange-50 flex-shrink-0 font-semibold"
              onClick={goToPending}
            >
              Xử lý ngay
            </Button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Chờ xét duyệt"
            value={stats.submitted}
            sub="Yêu cầu mới"
            icon={Inbox}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200"
            onClick={goToPending}
            active={activeTab === 'pending'}
          />
          <StatCard
            label="Đang xét"
            value={stats.underReview}
            sub="Đang trong quy trình"
            icon={Clock}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-200"
            onClick={() => setActiveTab('in_review')}
            active={activeTab === 'in_review'}
          />
          <StatCard
            label="Đã duyệt"
            value={stats.approved}
            sub="Tổng cộng"
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200"
            onClick={() => setActiveTab('approved')}
            active={activeTab === 'approved'}
          />
          <StatCard
            label="Từ chối"
            value={stats.rejected}
            sub="Không đạt"
            icon={XCircle}
            gradient="bg-gradient-to-br from-rose-500 to-red-600 shadow-md shadow-rose-200"
            onClick={() => setActiveTab('rejected')}
            active={activeTab === 'rejected'}
          />
        </div>

        {/* ── Tab bar + Filters ── */}
        <div ref={tableRef} className="bg-white rounded-2xl border shadow-sm">
          {/* Tab strip */}
          <div className="flex items-center gap-1 p-2 border-b overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count =
                tab.key === 'pending' ? stats.submitted :
                tab.key === 'in_review' ? stats.underReview :
                tab.key === 'approved' ? stats.approved :
                tab.key === 'rejected' ? stats.rejected :
                stats.total;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 p-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm mã, tiêu đề, tên cán bộ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
                className="pl-9 h-8 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={() => setSearch(searchInput)}
            >
              <Search className="h-3.5 w-3.5" /> Tìm
            </Button>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-red-500 hover:text-red-700"
                onClick={() => { setSearch(''); setSearchInput(''); setCategoryFilter('all'); }}
              >
                <X className="h-3.5 w-3.5" /> Xóa lọc
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="p-4 rounded-full bg-slate-100">
                  <Inbox className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-600">Không có yêu cầu nào</p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {activeTab === 'pending'
                    ? 'Chưa có yêu cầu mới nào chờ xét duyệt'
                    : 'Không tìm thấy yêu cầu phù hợp với bộ lọc'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600 pl-4">Mã YC</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Yêu cầu</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Cán bộ</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Danh mục</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Số tiền</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Ngày gửi</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center pr-4">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const isActionLoading = actionLoading === req.id;
                    const canProcess = req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW';
                    return (
                      <TableRow
                        key={req.id}
                        className={cn(
                          'group cursor-pointer hover:bg-blue-50/40 transition-colors',
                          isActionLoading && 'opacity-60 pointer-events-none'
                        )}
                        onClick={() => openDetail(req)}
                      >
                        <TableCell className="pl-4">
                          <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {req.requestNumber}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <p className="font-medium text-sm truncate text-slate-800">{req.title}</p>
                          {req.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">{req.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-slate-600">
                                {req.requester.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{req.requester.name}</p>
                              <p className="text-xs text-slate-500">
                                {req.requester.rank ?? req.requester.position ?? req.requester.unit ?? '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium">
                            {req.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'text-sm font-semibold',
                            req.requestedAmount ? 'text-blue-700' : 'text-slate-400'
                          )}>
                            {fmtCurrency(req.requestedAmount)}
                          </span>
                          {req.approvedAmount && (
                            <p className="text-xs text-emerald-600">✓ {fmtCurrency(req.approvedAmount)}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-slate-600">{fmtDate(req.submittedAt ?? req.createdAt)}</p>
                          <p className="text-xs text-slate-400">{fmtRelative(req.submittedAt ?? req.createdAt)}</p>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={req.status} />
                        </TableCell>
                        <TableCell className="text-center pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); openDetail(req); }}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {canProcess && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetail(req);
                                  }}
                                  title="Phê duyệt / Từ chối"
                                  disabled={isActionLoading}
                                >
                                  {isActionLoading
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <ClipboardCheck className="h-3.5 w-3.5" />}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-muted-foreground">
                Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} yêu cầu
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      <DetailDialog
        req={selectedReq}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedReq(null); }}
        onAction={handleAction}
      />
    </div>
  );
}
