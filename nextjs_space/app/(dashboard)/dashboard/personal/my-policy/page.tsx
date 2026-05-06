'use client';

/**
 * /dashboard/personal/my-policy
 * Chính sách của tôi — cán bộ xem thống kê, khai báo và theo dõi yêu cầu chính sách.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Send, Save, Eye, Trash2, RefreshCw, X,
  ShieldCheck, Award, Gavel, TrendingUp, Users, Calendar,
  ArrowRight, Loader2, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyStats {
  totalRecords: number;
  totalRequests: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  completed: number;
}

interface PolicyRecord {
  id: string;
  recordType: 'EMULATION' | 'REWARD' | 'DISCIPLINE';
  form: string | null;
  level: string;
  title: string;
  reason: string;
  decisionNumber: string | null;
  decisionDate: string | null;
  effectiveDate: string | null;
  signerName: string | null;
  issuingUnit: string | null;
  status: string;
  workflowStatus: string;
  year: number | null;
  achievementSummary: string | null;
  createdAt: string;
}

interface WorkflowLog {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
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
  status: string;
  effectiveDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  approverNote: string | null;
  createdAt: string;
  category: { id: string; code: string; name: string };
  workflowLogs: WorkflowLog[];
  _count: { attachments: number };
}

interface PolicyCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  requiresApproval: boolean;
}

interface PolicyData {
  policyRecords: PolicyRecord[];
  policyRequests: PolicyRequest[];
  categories: PolicyCategory[];
  stats: PolicyStats;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  DRAFT:        { label: 'Nháp',          color: 'text-slate-600',  bgColor: 'bg-slate-100',   icon: Save },
  SUBMITTED:    { label: 'Đã gửi',        color: 'text-blue-600',   bgColor: 'bg-blue-50',     icon: Send },
  UNDER_REVIEW: { label: 'Đang xét duyệt', color: 'text-amber-600', bgColor: 'bg-amber-50',    icon: Clock },
  APPROVED:     { label: 'Đã duyệt',      color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle2 },
  REJECTED:     { label: 'Từ chối',       color: 'text-red-600',    bgColor: 'bg-red-50',      icon: XCircle },
  CANCELLED:    { label: 'Đã hủy',        color: 'text-slate-500',  bgColor: 'bg-slate-50',    icon: X },
  COMPLETED:    { label: 'Hoàn thành',    color: 'text-teal-600',   bgColor: 'bg-teal-50',     icon: CheckCircle2 },
};

const RECORD_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EMULATION: { label: 'Thi đua',  color: 'text-blue-600',    icon: TrendingUp },
  REWARD:    { label: 'Khen thưởng', color: 'text-amber-600', icon: Award },
  DISCIPLINE:{ label: 'Kỷ luật', color: 'text-red-600',     icon: Gavel },
};

const WORKFLOW_ACTION_LABELS: Record<string, string> = {
  CREATE:  'Tạo hồ sơ',
  UPDATE:  'Cập nhật',
  SUBMIT:  'Gửi yêu cầu',
  REVIEW:  'Trả lại xem xét',
  APPROVE: 'Phê duyệt',
  REJECT:  'Từ chối',
  CANCEL:  'Hủy yêu cầu',
  COMPLETE:'Hoàn thành',
};

const WORKFLOW_ACTION_COLOR: Record<string, string> = {
  CREATE:  'border-slate-300 bg-slate-50',
  UPDATE:  'border-slate-300 bg-slate-50',
  SUBMIT:  'border-blue-300 bg-blue-50',
  REVIEW:  'border-amber-300 bg-amber-50',
  APPROVE: 'border-emerald-300 bg-emerald-50',
  REJECT:  'border-red-300 bg-red-50',
  CANCEL:  'border-slate-300 bg-slate-50',
  COMPLETE:'border-teal-300 bg-teal-50',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(n: number | null | undefined) {
  if (!n) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function formatRelative(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return formatDate(s);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, description,
}: {
  label: string; value: number | string; icon: React.ElementType; color: string; description?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <div className={cn('absolute inset-0 opacity-5', color.replace('text-', 'bg-'))} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <div className={cn('p-2 rounded-lg', color.replace('text-', 'bg-').replace('600', '100'))}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Info };
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.bgColor, cfg.color)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function WorkflowTimeline({ logs }: { logs: WorkflowLog[] }) {
  return (
    <div className="space-y-2 pt-2">
      {[...logs].reverse().map((log, idx) => {
        const isLast = idx === logs.length - 1;
        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full border-2 mt-1 flex-shrink-0',
                idx === 0 ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'
              )} />
              {!isLast && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
            </div>
            <div className={cn(
              'flex-1 rounded-lg border p-2.5 mb-2 text-xs',
              idx === 0 ? WORKFLOW_ACTION_COLOR[log.action] ?? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
            )}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold">
                  {WORKFLOW_ACTION_LABELS[log.action] ?? log.action}
                </span>
                <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
              </div>
              {log.performerName && (
                <p className="text-muted-foreground mt-0.5">Bởi: {log.performerName}{log.performerRole ? ` (${log.performerRole})` : ''}</p>
              )}
              {log.note && <p className="mt-1 text-slate-700 italic">"{log.note}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestCard({
  req, onSubmit, onCancel, onDelete, onViewDetail,
}: {
  req: PolicyRequest;
  onSubmit: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetail: (req: PolicyRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.DRAFT;

  return (
    <div className={cn(
      'rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md',
      req.status === 'APPROVED' && 'border-emerald-200',
      req.status === 'REJECTED' && 'border-red-200',
      req.status === 'SUBMITTED' && 'border-blue-200',
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                {req.requestNumber}
              </code>
              <Badge variant="outline" className="text-xs">{req.category.name}</Badge>
              <StatusBadge status={req.status} />
            </div>
            <h3 className="font-semibold text-sm mt-2 line-clamp-2">{req.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Gửi ngày {formatDate(req.createdAt)}
              {req.submittedAt && ` · Trình: ${formatDate(req.submittedAt)}`}
              {req.approvedAt && ` · Duyệt: ${formatDate(req.approvedAt)}`}
            </p>
          </div>
          {req.requestedAmount && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">Số tiền</p>
              <p className="font-bold text-sm text-slate-700">{formatCurrency(req.requestedAmount)}</p>
              {req.approvedAmount && (
                <p className="text-xs text-emerald-600 font-medium">✓ {formatCurrency(req.approvedAmount)}</p>
              )}
            </div>
          )}
        </div>

        {/* Rejection reason */}
        {req.status === 'REJECTED' && req.rejectReason && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
            <span className="font-medium">Lý do từ chối: </span>{req.rejectReason}
          </div>
        )}

        {/* Approval note */}
        {req.status === 'APPROVED' && req.approverNote && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
            <span className="font-medium">Ghi chú duyệt: </span>{req.approverNote}
          </div>
        )}
      </div>

      {/* Timeline expandable */}
      <div className="border-t bg-slate-50/50">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Tiến trình ({req.workflowLogs.length} bước)
          </span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {expanded && (
          <div className="px-4 pb-3">
            <WorkflowTimeline logs={req.workflowLogs} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onViewDetail(req)}>
          <Eye className="h-3 w-3" /> Chi tiết
        </Button>
        {req.status === 'DRAFT' && (
          <>
            <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => onSubmit(req.id)}>
              <Send className="h-3 w-3" /> Gửi duyệt
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(req.id)}>
              <Trash2 className="h-3 w-3" /> Xóa
            </Button>
          </>
        )}
        {req.status === 'SUBMITTED' && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-slate-600" onClick={() => onCancel(req.id)}>
            <X className="h-3 w-3" /> Hủy yêu cầu
          </Button>
        )}
      </div>
    </div>
  );
}

function RecordCard({ record }: { record: PolicyRecord }) {
  const typeCfg = RECORD_TYPE_CONFIG[record.recordType] ?? RECORD_TYPE_CONFIG.REWARD;
  const TypeIcon = typeCfg.icon;

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg flex-shrink-0', typeCfg.color.replace('text-', 'bg-').replace('600', '100'))}>
          <TypeIcon className={cn('h-4 w-4', typeCfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', typeCfg.color.replace('text-', 'bg-').replace('600', '100'), typeCfg.color)}>
              {typeCfg.label}
            </span>
            {record.level && (
              <Badge variant="outline" className="text-xs">{record.level}</Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm mt-1.5">{record.title}</h3>
          {record.decisionNumber && (
            <p className="text-xs text-muted-foreground mt-0.5">
              QĐ số: <span className="font-medium text-slate-700">{record.decisionNumber}</span>
              {record.decisionDate && ` ngày ${formatDate(record.decisionDate)}`}
            </p>
          )}
          {record.issuingUnit && (
            <p className="text-xs text-muted-foreground mt-0.5">Đơn vị cấp: {record.issuingUnit}</p>
          )}
          {record.achievementSummary && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{record.achievementSummary}</p>
          )}
        </div>
        {record.year && (
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-muted-foreground">Năm</span>
            <p className="font-bold text-slate-700">{record.year}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Request Form Dialog ──────────────────────────────────────────────────────

interface RequestFormState {
  categoryId: string;
  title: string;
  description: string;
  reason: string;
  requestedAmount: string;
  effectiveDate: string;
  notes: string;
}

const EMPTY_FORM: RequestFormState = {
  categoryId: '', title: '', description: '', reason: '',
  requestedAmount: '', effectiveDate: '', notes: '',
};

function NewRequestDialog({
  open, onClose, categories, onSuccess,
}: {
  open: boolean; onClose: () => void; categories: PolicyCategory[]; onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RequestFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  function handleClose() {
    setStep(1);
    setForm(EMPTY_FORM);
    onClose();
  }

  function patch(key: keyof RequestFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(submit: boolean) {
    if (!form.categoryId || !form.title.trim() || !form.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/personal/my-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          title: form.title.trim(),
          description: form.description.trim(),
          reason: form.reason.trim() || undefined,
          requestedAmount: form.requestedAmount ? parseFloat(form.requestedAmount) : undefined,
          effectiveDate: form.effectiveDate || undefined,
          action: submit ? 'SUBMIT' : 'DRAFT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(submit ? 'Đã gửi yêu cầu thành công!' : 'Đã lưu nháp thành công!');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error ?? 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            Khai báo yêu cầu chính sách
          </DialogTitle>
          <DialogDescription>
            Khai báo chế độ chính sách. Dữ liệu sẽ được gửi đến bộ phận quản lý CSDL chính sách để xử lý.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => s < step && setStep(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                )}
              >
                {step > s ? <CheckCircle2 className="h-3 w-3" /> : <span>{s}</span>}
                {s === 1 ? 'Thông tin cơ bản' : 'Xem lại & Gửi'}
              </button>
              {s < 2 && <ChevronRight className="h-3 w-3 text-slate-400" />}
            </div>
          ))}
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Loại chính sách <span className="text-red-500">*</span></Label>
              <Select value={form.categoryId} onValueChange={(v) => patch('categoryId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục chính sách..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.description && <span className="text-muted-foreground ml-2 text-xs">— {c.description}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory?.requiresApproval && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Danh mục này yêu cầu phê duyệt từ cấp trên
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tiêu đề yêu cầu <span className="text-red-500">*</span></Label>
              <Input
                placeholder="VD: Đề nghị hưởng chế độ phụ cấp khu vực..."
                value={form.title}
                onChange={(e) => patch('title', e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Mô tả chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Mô tả đầy đủ nội dung yêu cầu, căn cứ pháp lý, hoàn cảnh cụ thể..."
                rows={4}
                value={form.description}
                onChange={(e) => patch('description', e.target.value)}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{form.description.length}/2000</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Lý do / Căn cứ</Label>
              <Textarea
                placeholder="Căn cứ theo Thông tư số... / Nghị định số..."
                rows={2}
                value={form.reason}
                onChange={(e) => patch('reason', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Số tiền đề nghị (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.requestedAmount}
                  onChange={(e) => patch('requestedAmount', e.target.value)}
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Ngày có hiệu lực</Label>
                <Input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => patch('effectiveDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border bg-slate-50 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loại chính sách</span>
                <span className="font-medium">{selectedCategory?.name ?? '—'}</span>
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-1">Tiêu đề</p>
                <p className="font-semibold">{form.title}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-1">Mô tả</p>
                <p className="text-slate-700 whitespace-pre-line">{form.description}</p>
              </div>
              {form.reason && (
                <div className="border-t pt-3">
                  <p className="text-muted-foreground mb-1">Căn cứ</p>
                  <p className="text-slate-700">{form.reason}</p>
                </div>
              )}
              <div className="border-t pt-3 grid grid-cols-2 gap-3">
                {form.requestedAmount && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Số tiền</p>
                    <p className="font-semibold text-blue-700">{formatCurrency(parseFloat(form.requestedAmount))}</p>
                  </div>
                )}
                {form.effectiveDate && (
                  <div>
                    <p className="text-muted-foreground mb-0.5">Hiệu lực từ</p>
                    <p className="font-medium">{formatDate(form.effectiveDate)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">Lưu ý khi gửi:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Hồ sơ sẽ được chuyển tới quản lý CSDL chính sách để xử lý</li>
                <li>Bạn có thể theo dõi trạng thái xử lý tại mục Yêu cầu của tôi</li>
                {selectedCategory?.requiresApproval && <li>Yêu cầu này cần được phê duyệt từ cấp trên</li>}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 pt-2">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={submitting}>Hủy</Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={submitting || !form.categoryId || !form.title || !form.description}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu nháp
              </Button>
              <Button
                onClick={() => {
                  if (!form.categoryId || !form.title.trim() || !form.description.trim()) {
                    toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                    return;
                  }
                  setStep(2);
                }}
                disabled={!form.categoryId || !form.title || !form.description}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Xem lại <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                Quay lại
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu nháp
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Gửi yêu cầu
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function RequestDetailDialog({
  req, open, onClose,
}: {
  req: PolicyRequest | null; open: boolean; onClose: () => void;
}) {
  if (!req) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground bg-slate-100 px-2 py-1 rounded">
              {req.requestNumber}
            </code>
            <StatusBadge status={req.status} />
          </div>
          <DialogTitle className="text-base mt-2">{req.title}</DialogTitle>
          <DialogDescription>{req.category.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Ngày tạo</p>
              <p className="font-medium">{formatDate(req.createdAt)}</p>
            </div>
            {req.submittedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Ngày gửi</p>
                <p className="font-medium">{formatDate(req.submittedAt)}</p>
              </div>
            )}
            {req.requestedAmount && (
              <div>
                <p className="text-xs text-muted-foreground">Số tiền đề nghị</p>
                <p className="font-semibold text-blue-700">{formatCurrency(req.requestedAmount)}</p>
              </div>
            )}
            {req.approvedAmount && (
              <div>
                <p className="text-xs text-muted-foreground">Số tiền duyệt</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(req.approvedAmount)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Mô tả</p>
            <p className="text-slate-700 whitespace-pre-line bg-white border rounded-lg p-3">{req.description}</p>
          </div>

          {req.reason && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Căn cứ</p>
              <p className="text-slate-700 bg-white border rounded-lg p-3">{req.reason}</p>
            </div>
          )}

          {req.rejectReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Lý do từ chối</p>
              <p className="text-red-700">{req.rejectReason}</p>
            </div>
          )}

          {req.approverNote && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Ghi chú phê duyệt</p>
              <p className="text-emerald-700">{req.approverNote}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Lịch sử tiến trình
            </p>
            <WorkflowTimeline logs={req.workflowLogs} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyPolicyPage() {
  const [data, setData] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [detailReq, setDetailReq] = useState<PolicyRequest | null>(null);
  const [activeTab, setActiveTab] = useState('requests');
  const [requestFilter, setRequestFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/personal/my-policy');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? 'Không thể tải dữ liệu');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/personal/my-policy/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã gửi yêu cầu đến bộ phận quản lý!');
        fetchData(true);
      } else {
        toast.error(json.error ?? 'Lỗi khi gửi yêu cầu');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/personal/my-policy/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã hủy yêu cầu');
        fetchData(true);
      } else {
        toast.error(json.error ?? 'Lỗi khi hủy');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa hồ sơ nháp này? Hành động không thể hoàn tác.')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/personal/my-policy/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã xóa hồ sơ');
        fetchData(true);
      } else {
        toast.error(json.error ?? 'Lỗi khi xóa');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(null);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-white rounded-xl border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => fetchData()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const pendingCount = (stats?.draft ?? 0) + (stats?.submitted ?? 0) + (stats?.underReview ?? 0);

  const filteredRequests = (data?.policyRequests ?? []).filter((r) => {
    if (requestFilter === 'all') return true;
    if (requestFilter === 'pending') return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(r.status);
    return r.status === requestFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* ── Hero Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Chính sách của tôi</h1>
              <p className="text-sm text-muted-foreground">Xem, khai báo và theo dõi chế độ chính sách cá nhân</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Làm mới
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-sm"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Gửi yêu cầu mới
            </Button>
          </div>
        </div>

        {/* ── Pending Alert ── */}
        {pendingCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-amber-100 flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Bạn có {pendingCount} yêu cầu đang chờ xử lý
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {stats?.draft ? `${stats.draft} nháp` : ''}
                {stats?.submitted ? `${stats.draft ? ' · ' : ''}${stats.submitted} đã gửi` : ''}
                {stats?.underReview ? ` · ${stats.underReview} đang xét duyệt` : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 flex-shrink-0"
              onClick={() => { setActiveTab('requests'); setRequestFilter('pending'); }}>
              Xem ngay
            </Button>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Hồ sơ chính sách" value={stats?.totalRecords ?? 0} icon={FileText} color="text-indigo-600" description="Khen thưởng, kỷ luật" />
          <StatCard label="Yêu cầu đã gửi" value={stats?.totalRequests ?? 0} icon={Send} color="text-blue-600" description="Tổng các yêu cầu" />
          <StatCard label="Đã được duyệt" value={stats?.approved ?? 0} icon={CheckCircle2} color="text-emerald-600" description="Hoàn thành xử lý" />
          <StatCard label="Đang xử lý" value={pendingCount} icon={Clock} color="text-amber-600" description="Cần theo dõi" />
        </div>

        {/* ── Main Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-10 bg-white border shadow-sm">
            <TabsTrigger value="requests" className="gap-1.5 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Send className="h-3.5 w-3.5" />
              Yêu cầu của tôi
              {(stats?.totalRequests ?? 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  {stats?.totalRequests}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-1.5 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Award className="h-3.5 w-3.5" />
              Hồ sơ chính sách
              {(stats?.totalRecords ?? 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                  {stats?.totalRecords}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Requests Tab ── */}
          <TabsContent value="requests" className="space-y-4 mt-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Lọc theo:</span>
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'pending', label: 'Đang xử lý' },
                { value: 'DRAFT', label: 'Nháp' },
                { value: 'SUBMITTED', label: 'Đã gửi' },
                { value: 'APPROVED', label: 'Đã duyệt' },
                { value: 'REJECTED', label: 'Từ chối' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setRequestFilter(f.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                    requestFilter === f.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">Chưa có yêu cầu nào</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {requestFilter === 'all'
                    ? 'Bấm "Gửi yêu cầu mới" để bắt đầu khai báo chế độ chính sách'
                    : 'Không có yêu cầu nào ở trạng thái này'}
                </p>
                {requestFilter === 'all' && (
                  <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowNewDialog(true)}>
                    <Plus className="h-4 w-4" /> Gửi yêu cầu đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn('space-y-3', actionLoading && 'pointer-events-none opacity-70')}>
                {filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onViewDetail={setDetailReq}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Records Tab ── */}
          <TabsContent value="records" className="space-y-4 mt-4">
            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              {(['EMULATION', 'REWARD', 'DISCIPLINE'] as const).map((type) => {
                const cfg = RECORD_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const count = (data?.policyRecords ?? []).filter((r) => r.recordType === type).length;
                return (
                  <div key={type} className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border bg-white text-sm',
                    cfg.color.replace('text-', 'border-').replace('600', '200')
                  )}>
                    <Icon className={cn('h-4 w-4', cfg.color)} />
                    <span className="text-muted-foreground">{cfg.label}:</span>
                    <span className={cn('font-bold', cfg.color)}>{count}</span>
                  </div>
                );
              })}
            </div>

            {(data?.policyRecords ?? []).length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Award className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700">Chưa có hồ sơ chính sách</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hồ sơ khen thưởng và kỷ luật sẽ hiển thị tại đây
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.policyRecords ?? []).map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <NewRequestDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        categories={data?.categories ?? []}
        onSuccess={() => fetchData(true)}
      />

      <RequestDetailDialog
        req={detailReq}
        open={!!detailReq}
        onClose={() => setDetailReq(null)}
      />
    </div>
  );
}
