'use client';

/**
 * Dialog chi tiết + duyệt đề nghị cập nhật hồ sơ (cho người duyệt).
 * Hiển thị diff từng mục + minh chứng; nút Duyệt/Trả lại/Từ chối theo cấp.
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Paperclip, Check, Undo2, X } from 'lucide-react';
import {
  PROFILE_CHANGE_ITEM_TYPE_LABELS, findExtendedField, type ProfileChangeItemTypeValue,
} from '@/lib/constants/profile-change';
import { getCadreSection } from '@/lib/constants/cadre-profile-sections';

interface DetailItem {
  id: string;
  itemType: ProfileChangeItemTypeValue;
  fieldName: string | null;
  sectionSlug: string | null;
  currentValue: string | null;
  requestedValue: unknown;
  isSensitive: boolean;
}
interface DetailAttachment { id: string; fileName: string; fileUrl: string; }
interface Detail {
  id: string;
  reason: string | null;
  status: string;
  user: { name: string | null; militaryId: string | null; unitRelation?: { name: string | null } | null };
  items: DetailItem[];
  attachments: DetailAttachment[];
}

interface Props {
  requestId: string | null;
  tier: 1 | 2;
  canApprove: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActed: () => void;
}

function itemLabel(it: DetailItem): string {
  if (it.itemType === 'EXTENDED_FIELD') return findExtendedField(it.fieldName ?? '')?.label ?? it.fieldName ?? '';
  return `${PROFILE_CHANGE_ITEM_TYPE_LABELS[it.itemType]} · ${getCadreSection(it.sectionSlug ?? '')?.title ?? it.sectionSlug}`;
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v, null, 0);
  return String(v);
}

export function ReviewDetailDialog({ requestId, tier, canApprove, open, onOpenChange, onActed }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/personnel/profile-changes/${requestId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được chi tiết');
      setDetail(data.data);
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [requestId, onOpenChange]);

  useEffect(() => { if (open && requestId) { setNote(''); load(); } }, [open, requestId, load]);

  const act = async (action: 'APPROVE' | 'RETURN' | 'REJECT') => {
    if (!requestId) return;
    if ((action === 'REJECT' || action === 'RETURN') && !note.trim()) {
      return toast({ title: 'Vui lòng nhập lý do', variant: 'destructive' });
    }
    setActing(true);
    try {
      const res = await fetch(`/api/personnel/profile-changes/${requestId}/actions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ tier, action, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác thất bại');
      const msg = action === 'APPROVE'
        ? (tier === 2 ? 'Đã duyệt & cập nhật vào CSDL' : 'Đã duyệt cấp 1, chuyển Ban cán bộ/Quân lực')
        : action === 'RETURN' ? 'Đã trả lại để bổ sung' : 'Đã từ chối';
      toast({ title: msg });
      onOpenChange(false);
      onActed();
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setActing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết đề nghị cập nhật hồ sơ</DialogTitle>
          <DialogDescription>
            {tier === 1 ? 'Duyệt cấp 1 — Chỉ huy đơn vị' : 'Duyệt cấp 2 — Ban cán bộ/Quân lực (commit vào CSDL)'}
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <div><span className="text-muted-foreground">Cán bộ: </span><b>{detail.user.name}</b> {detail.user.militaryId && `(${detail.user.militaryId})`}</div>
              {detail.user.unitRelation?.name && <div><span className="text-muted-foreground">Đơn vị: </span>{detail.user.unitRelation.name}</div>}
              {detail.reason && <div className="mt-1"><span className="text-muted-foreground">Lý do: </span>{detail.reason}</div>}
            </div>

            <div className="space-y-2">
              <Label>Nội dung thay đổi ({detail.items.length})</Label>
              {detail.items.map((it) => (
                <div key={it.id} className="rounded border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{itemLabel(it)}</span>
                    {it.isSensitive && <Badge variant="destructive" className="text-[10px]">Nhạy cảm</Badge>}
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">Hiện tại: </span>{it.currentValue ?? '—'}
                    <span className="mx-1">→</span>
                    <span className="font-medium text-emerald-700">{renderValue(it.requestedValue)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <Label>Minh chứng ({detail.attachments.length})</Label>
              {detail.attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Không có minh chứng đính kèm.</p>
              ) : (
                <ul className="space-y-1">
                  {detail.attachments.map((a) => (
                    <li key={a.id}>
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <Paperclip className="h-3 w-3" /> {a.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canApprove && (
              <div className="grid gap-1">
                <Label>Ghi chú duyệt (bắt buộc khi trả lại/từ chối)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {canApprove && detail && (
            <>
              <Button variant="outline" onClick={() => act('REJECT')} disabled={acting}>
                <X className="mr-1 h-4 w-4" /> Từ chối
              </Button>
              <Button variant="outline" onClick={() => act('RETURN')} disabled={acting}>
                <Undo2 className="mr-1 h-4 w-4" /> Trả lại
              </Button>
              <Button onClick={() => act('APPROVE')} disabled={acting}>
                <Check className="mr-1 h-4 w-4" /> {tier === 2 ? 'Duyệt & cập nhật CSDL' : 'Duyệt cấp 1'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
