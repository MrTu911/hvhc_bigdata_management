'use client';

/**
 * CareerEventCorrectionDialog — đính chính CÓ CẤU TRÚC một sự kiện quá trình công tác.
 *
 * Thay cho luồng tự-do cũ (đã bỏ): dialog dựng form từ metadata section 'career-history',
 * prefill giá trị hiện tại của sự kiện, và gửi một đề nghị SECTION_UPDATE qua luồng duyệt
 * 2 cấp (POST /api/profile/change-requests → PATCH submit). Sau khi Ban cán bộ/Quân lực
 * duyệt, thay đổi được commit vào CareerHistory (liên thông Personnel). Chỉ gửi các trường
 * THỰC SỰ thay đổi (đúng bản chất "đính chính").
 */

import { useMemo, useState } from 'react';
import { PencilLine, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { getCadreSection, type CadreField } from '@/lib/constants/cadre-profile-sections';

const CAREER_SECTION_SLUG = 'career-history';

/** Chuyển giá trị thô (ISO date / enum / text) thành chuỗi để prefill input. */
function toFieldString(field: CadreField, raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (field.type === 'date') return String(raw).slice(0, 10); // ISO → YYYY-MM-DD
  return String(raw);
}

function FieldInput({ field, value, onChange }: { field: CadreField; value: string; onChange: (v: string) => void }) {
  if (field.type === 'select') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="-- Chọn --" /></SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === 'textarea') return <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />;
  const inputType = field.type === 'date' ? 'date' : 'text';
  return <Input type={inputType} value={value} onChange={(e) => onChange(e.target.value)} />;
}

interface CareerEventCorrectionDialogProps {
  /** Sự kiện cần đính chính — phải có id + các trường khớp section 'career-history'. */
  event: Record<string, unknown> & { id: string };
  /** Mô tả tóm tắt sự kiện (hiển thị diff "giá trị hiện tại"). */
  summary?: string;
  triggerLabel?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default';
  onSubmitted?: () => void;
}

export function CareerEventCorrectionDialog({
  event,
  summary,
  triggerLabel = 'Đề nghị sửa',
  variant = 'ghost',
  size = 'sm',
  onSubmitted,
}: CareerEventCorrectionDialogProps) {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const section = getCadreSection(CAREER_SECTION_SLUG);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  // Giá trị gốc (đã chuẩn hoá chuỗi) để so sánh & prefill.
  const original = useMemo(() => {
    const out: Record<string, string> = {};
    if (section) for (const f of section.fields) out[f.name] = toFieldString(f, event[f.name]);
    return out;
  }, [section, event]);

  const [draft, setDraft] = useState<Record<string, string>>(original);

  if (!section) return null;
  if (!permLoading && !hasPermission(PROFILE_CHANGE.CREATE)) return null;

  const setField = (name: string, v: string) => setDraft((p) => ({ ...p, [name]: v }));

  async function handleSubmit() {
    // Chỉ lấy trường thực sự thay đổi.
    const changed: Record<string, unknown> = {};
    for (const f of section!.fields) {
      const cur = draft[f.name] ?? '';
      if (cur !== (original[f.name] ?? '')) changed[f.name] = cur === '' ? null : cur;
    }
    if (Object.keys(changed).length === 0) {
      toast({ title: 'Chưa có thay đổi', description: 'Hãy sửa ít nhất một trường để đính chính.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const createRes = await fetch('/api/profile/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: reason || 'Đính chính sự kiện quá trình công tác',
          items: [{
            itemType: 'SECTION_UPDATE',
            sectionSlug: CAREER_SECTION_SLUG,
            targetRecordId: event.id,
            currentValue: summary ?? null,
            requestedValue: changed,
          }],
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error?.formErrors?.join?.('; ') || createData.error || 'Tạo đề nghị thất bại');
      }
      const requestId = createData.data.id;

      const subRes = await fetch(`/api/profile/change-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'submit' }),
      });
      if (!subRes.ok) throw new Error((await subRes.json()).error || 'Gửi duyệt thất bại');

      toast({ title: 'Đã gửi đề nghị đính chính', description: 'Đề nghị đang chờ chỉ huy đơn vị / Ban cán bộ duyệt.' });
      setOpen(false);
      setReason('');
      onSubmitted?.();
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(original); }}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <PencilLine className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đề nghị đính chính sự kiện công tác</DialogTitle>
          <DialogDescription>
            Sửa các trường cần đính chính. Đề nghị sẽ được Chỉ huy đơn vị và Ban cán bộ/Quân lực duyệt
            trước khi cập nhật CSDL.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {section.fields.map((f) => (
            <div key={f.name} className="grid gap-1">
              <Label className="text-xs">{f.label}</Label>
              <FieldInput field={f} value={draft[f.name] ?? ''} onChange={(v) => setField(f.name, v)} />
            </div>
          ))}
        </div>

        <div className="grid gap-1.5">
          <Label>Lý do đính chính</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Nêu lý do / căn cứ đính chính..." />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Gửi duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
