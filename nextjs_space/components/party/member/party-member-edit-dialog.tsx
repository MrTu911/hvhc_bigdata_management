'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PartyMemberStatus } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PARTY } from '@/lib/rbac/function-codes';
import {
  PARTY_STATUS_LABELS,
  REVIEW_GRADES,
  getEditablePartyStatusOptions,
} from '@/lib/constants/party.labels';
import { Loader2, Lock, Save, ShieldAlert } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PartyOrgOption {
  id: string;
  code?: string | null;
  name: string;
}

interface PartyMemberEditDialogProps {
  /** ID hồ sơ đảng viên cần sửa. Null/empty = dialog đóng. */
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi sau khi lưu thành công (để trang cha refetch). */
  onSaved?: () => void;
}

interface EditFormState {
  partyCardNumber: string;
  partyRole: string;
  organizationId: string; // NONE_ORG hoặc id thật
  joinDate: string; // yyyy-MM-dd
  officialDate: string; // yyyy-MM-dd
  recommender1: string;
  recommender2: string;
  currentReviewGrade: string; // '' hoặc grade key
  currentDebtAmount: string;
  confidentialNote: string;
  status: PartyMemberStatus;
  statusChangeReason: string;
}

const NONE_ORG = '__none__';
const NO_GRADE = '__none__';

const EMPTY_FORM: EditFormState = {
  partyCardNumber: '',
  partyRole: '',
  organizationId: NONE_ORG,
  joinDate: '',
  officialDate: '',
  recommender1: '',
  recommender2: '',
  currentReviewGrade: '',
  currentDebtAmount: '0',
  confidentialNote: '',
  status: 'QUAN_CHUNG',
  statusChangeReason: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // Dùng local date parts để tránh lệch ngày do timezone.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function PartyMemberEditDialog({
  memberId,
  open,
  onOpenChange,
  onSaved,
}: PartyMemberEditDialogProps) {
  const { hasAnyPermission } = usePermissions();
  const canEditSensitive = hasAnyPermission([PARTY.UPDATE_SENSITIVE]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [initialStatus, setInitialStatus] = useState<PartyMemberStatus>('QUAN_CHUNG');
  const [orgs, setOrgs] = useState<PartyOrgOption[]>([]);
  const [form, setForm] = useState<EditFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof EditFormState, string>>>({});

  const set = useCallback(<K extends keyof EditFormState>(key: K, val: EditFormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  // Tải dữ liệu hiện tại + danh sách tổ chức Đảng khi mở dialog.
  useEffect(() => {
    if (!open || !memberId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      setErrors({});
      try {
        const [memberRes, orgRes] = await Promise.all([
          fetch(`/api/party/members/${memberId}`, { credentials: 'include' }),
          fetch('/api/party/orgs?isActive=true&limit=200', { credentials: 'include' }),
        ]);
        const memberJson = await memberRes.json();
        if (!memberRes.ok || !memberJson?.success) {
          throw new Error(memberJson?.error || 'Không tải được hồ sơ đảng viên');
        }
        const orgJson = await orgRes.json().catch(() => null);

        if (cancelled) return;

        const m = memberJson.data;
        const status = (m.status ?? 'QUAN_CHUNG') as PartyMemberStatus;
        setMemberName(m.user?.name ?? '—');
        setInitialStatus(status);
        setOrgs(Array.isArray(orgJson?.data) ? orgJson.data : []);
        setForm({
          partyCardNumber: m.partyCardNumber ?? '',
          partyRole: m.partyRole ?? '',
          organizationId: m.organizationId ?? NONE_ORG,
          joinDate: toDateInputValue(m.joinDate),
          officialDate: toDateInputValue(m.officialDate),
          recommender1: m.recommender1 ?? '',
          recommender2: m.recommender2 ?? '',
          currentReviewGrade: m.currentReviewGrade ?? '',
          currentDebtAmount: m.currentDebtAmount != null ? String(m.currentDebtAmount) : '0',
          confidentialNote: m.confidentialNote ?? '',
          status,
          statusChangeReason: '',
        });
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, memberId]);

  const statusChanged = form.status !== initialStatus;
  const statusOptions = useMemo(() => getEditablePartyStatusOptions(initialStatus), [initialStatus]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof EditFormState, string>> = {};

    if (form.currentDebtAmount.trim() !== '') {
      const amount = Number(form.currentDebtAmount);
      if (Number.isNaN(amount) || amount < 0) {
        next.currentDebtAmount = 'Số nợ đảng phí phải là số không âm';
      }
    }

    if (form.joinDate && form.officialDate && form.officialDate < form.joinDate) {
      next.officialDate = 'Ngày chính thức không thể trước ngày dự bị';
    }

    if (statusChanged && !form.statusChangeReason.trim()) {
      next.statusChangeReason = 'Vui lòng nhập lý do thay đổi trạng thái';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!memberId) return;
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      partyCardNumber: trimOrNull(form.partyCardNumber),
      partyRole: trimOrNull(form.partyRole),
      organizationId: form.organizationId === NONE_ORG ? null : form.organizationId,
      joinDate: form.joinDate || null,
      officialDate: form.officialDate || null,
      recommender1: trimOrNull(form.recommender1),
      recommender2: trimOrNull(form.recommender2),
      currentReviewGrade: form.currentReviewGrade ? form.currentReviewGrade : null,
      currentDebtAmount: form.currentDebtAmount.trim() === '' ? 0 : Number(form.currentDebtAmount),
    };

    if (statusChanged) {
      payload.status = form.status;
      payload.statusChangeReason = trimOrNull(form.statusChangeReason);
    }

    // Chỉ gửi trường nhạy cảm khi user có quyền — backend từ chối nếu key có mặt
    // mà thiếu quyền UPDATE_PARTY_MEMBER_SENSITIVE.
    if (canEditSensitive) {
      payload.confidentialNote = trimOrNull(form.confidentialNote);
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/party/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Cập nhật hồ sơ thất bại');
      }
      toast({ title: 'Đã cập nhật', description: `Hồ sơ Đảng viên ${memberName} đã được lưu.` });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({
        title: 'Không thể cập nhật',
        description: err instanceof Error ? err.message : 'Đã xảy ra lỗi',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ Đảng viên</DialogTitle>
          <DialogDescription>
            {memberName ? `Cán bộ: ${memberName}` : 'Cập nhật thông tin hồ sơ theo thẩm quyền cơ quan quản lý'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải hồ sơ...
          </div>
        ) : loadError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Thông tin thẻ Đảng */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thông tin thẻ Đảng
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Số thẻ Đảng</Label>
                  <Input
                    value={form.partyCardNumber}
                    onChange={(e) => set('partyCardNumber', e.target.value)}
                    placeholder="VD: 1234567"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Chức vụ Đảng</Label>
                  <Input
                    value={form.partyRole}
                    onChange={(e) => set('partyRole', e.target.value)}
                    placeholder="VD: Bí thư chi bộ, Đảng viên..."
                  />
                </div>
              </div>
            </section>

            {/* Tổ chức Đảng */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổ chức Đảng (chi bộ)
              </h4>
              <Select value={form.organizationId} onValueChange={(v) => set('organizationId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tổ chức Đảng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_ORG}>— Chưa gán tổ chức —</SelectItem>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                      {o.code ? ` (${o.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Mốc thời gian */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mốc thời gian
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Ngày vào Đảng (dự bị)</Label>
                  <Input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => set('joinDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Ngày chính thức</Label>
                  <Input
                    type="date"
                    value={form.officialDate}
                    onChange={(e) => set('officialDate', e.target.value)}
                    className={errors.officialDate ? 'border-red-400' : ''}
                  />
                  {errors.officialDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.officialDate}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Người giới thiệu */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Người giới thiệu
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Người giới thiệu 1</Label>
                  <Input
                    value={form.recommender1}
                    onChange={(e) => set('recommender1', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Người giới thiệu 2</Label>
                  <Input
                    value={form.recommender2}
                    onChange={(e) => set('recommender2', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Đánh giá & đảng phí */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đánh giá & đảng phí
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Xếp loại gần nhất</Label>
                  <Select
                    value={form.currentReviewGrade || NO_GRADE}
                    onValueChange={(v) => set('currentReviewGrade', v === NO_GRADE ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chưa xếp loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GRADE}>— Chưa xếp loại —</SelectItem>
                      {REVIEW_GRADES.map((g) => (
                        <SelectItem key={g.key} value={g.key}>
                          {g.short} — {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Nợ đảng phí (đồng)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.currentDebtAmount}
                    onChange={(e) => set('currentDebtAmount', e.target.value)}
                    className={errors.currentDebtAmount ? 'border-red-400' : ''}
                  />
                  {errors.currentDebtAmount && (
                    <p className="mt-1 text-xs text-red-500">{errors.currentDebtAmount}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Trạng thái vòng đời */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái vòng đời
              </h4>
              <Select value={form.status} onValueChange={(v) => set('status', v as PartyMemberStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PARTY_STATUS_LABELS[s] ?? s}
                      {s === initialStatus ? ' (hiện tại)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusChanged && (
                <div>
                  <Label className="mb-1.5 block text-sm">
                    Lý do chuyển trạng thái <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    rows={2}
                    value={form.statusChangeReason}
                    onChange={(e) => set('statusChangeReason', e.target.value)}
                    placeholder="VD: Đủ điều kiện chuyển chính thức theo quyết định số..."
                    className={errors.statusChangeReason ? 'border-red-400' : ''}
                  />
                  {errors.statusChangeReason && (
                    <p className="mt-1 text-xs text-red-500">{errors.statusChangeReason}</p>
                  )}
                </div>
              )}
            </section>

            {/* Ghi chú mật — chỉ user có quyền nhạy cảm */}
            <section className="space-y-3">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" /> Ghi chú mật
              </h4>
              {canEditSensitive ? (
                <Textarea
                  rows={3}
                  value={form.confidentialNote}
                  onChange={(e) => set('confidentialNote', e.target.value)}
                  placeholder="Thông tin nhạy cảm — chỉ hiển thị cho người có thẩm quyền."
                />
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                  Bạn không có quyền xem/sửa ghi chú mật của hồ sơ Đảng viên.
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
