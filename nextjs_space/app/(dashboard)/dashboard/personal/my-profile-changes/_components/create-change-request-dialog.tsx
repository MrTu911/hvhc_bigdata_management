'use client';

/**
 * Dialog tạo đề nghị cập nhật hồ sơ cá nhân (kèm minh chứng) → gửi duyệt 2 cấp.
 * Hỗ trợ 4 loại mục:
 *   - EXTENDED_FIELD : sửa 1 trường hồ sơ mở rộng
 *   - SECTION_CREATE : thêm bản ghi danh sách HSCB
 *   - SECTION_UPDATE : sửa 1 bản ghi danh sách (chọn bản ghi → sửa)
 *   - SECTION_DELETE : xóa 1 bản ghi danh sách (chọn bản ghi)
 * Luồng: tạo nháp → upload minh chứng → gửi duyệt.
 */
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Paperclip, Send } from 'lucide-react';
import {
  EXTENDED_FIELD_GROUPS, CADRE_LIST_SECTIONS,
  type CadreField, type CadreListSection,
} from '@/lib/constants/cadre-profile-sections';

type ItemType = 'EXTENDED_FIELD' | 'SECTION_CREATE' | 'SECTION_UPDATE' | 'SECTION_DELETE';

type DraftItem =
  | { itemType: 'EXTENDED_FIELD'; fieldName: string; label: string; requestedValue: string }
  | { itemType: 'SECTION_CREATE'; sectionSlug: string; label: string; requestedValue: Record<string, unknown> }
  | { itemType: 'SECTION_UPDATE'; sectionSlug: string; targetRecordId: string; label: string; requestedValue: Record<string, unknown> }
  | { itemType: 'SECTION_DELETE'; sectionSlug: string; targetRecordId: string; label: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

const ITEM_TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'EXTENDED_FIELD', label: 'Sửa thông tin (trường hồ sơ)' },
  { value: 'SECTION_CREATE', label: 'Bổ sung bản ghi (danh sách)' },
  { value: 'SECTION_UPDATE', label: 'Sửa bản ghi danh sách' },
  { value: 'SECTION_DELETE', label: 'Xóa bản ghi danh sách' },
];

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
  const inputType = field.type === 'date' ? 'date' : (field.type === 'number' || field.type === 'decimal') ? 'number' : 'text';
  return <Input type={inputType} value={value} onChange={(e) => onChange(e.target.value)} />;
}

/** Chuyển 1 giá trị thô từ API thành chuỗi hiển thị/sửa. */
function toFieldString(field: CadreField, raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (field.type === 'date') return String(raw).slice(0, 10); // ISO → YYYY-MM-DD
  return String(raw);
}

/** Tóm tắt 1 bản ghi danh sách để hiển thị trong picker. */
function recordSummary(section: CadreListSection, rec: Record<string, unknown>): string {
  const parts = section.listColumns
    .map((col) => {
      const f = section.fields.find((ff) => ff.name === col);
      const v = rec[col];
      if (v === null || v === undefined || v === '') return null;
      return `${f?.label ?? col}: ${toFieldString(f ?? ({ type: 'text' } as CadreField), v)}`;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : `Bản ghi #${String(rec.id ?? '').slice(-6)}`;
}

export function CreateChangeRequestDialog({ open, onOpenChange, onSubmitted }: Props) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Sub-form state
  const [itemType, setItemType] = useState<ItemType>('EXTENDED_FIELD');
  const [groupIdx, setGroupIdx] = useState('0');
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [sectionSlug, setSectionSlug] = useState('');
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({});
  const [targetRecordId, setTargetRecordId] = useState('');
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const needsRecordPicker = itemType === 'SECTION_UPDATE' || itemType === 'SECTION_DELETE';

  const reset = () => {
    setItems([]); setReason(''); setFiles([]);
    setItemType('EXTENDED_FIELD'); setGroupIdx('0'); setFieldName(''); setFieldValue('');
    setSectionSlug(''); setSectionDraft({}); setTargetRecordId(''); setRecords([]);
  };

  const selectedGroup = EXTENDED_FIELD_GROUPS[Number(groupIdx)] ?? EXTENDED_FIELD_GROUPS[0];
  const selectedField = selectedGroup.fields.find((f) => f.name === fieldName);
  const selectedSection = CADRE_LIST_SECTIONS.find((s) => s.slug === sectionSlug);

  // Tải bản ghi hiện có khi cần picker (UPDATE/DELETE) + đã chọn nhóm.
  const loadRecords = useCallback(async (slug: string) => {
    setLoadingRecords(true);
    setRecords([]);
    try {
      const res = await fetch(`/api/profile/cadre-sections/${slug}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được bản ghi');
      setRecords(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    if (needsRecordPicker && sectionSlug) loadRecords(sectionSlug);
  }, [needsRecordPicker, sectionSlug, loadRecords]);

  // Khi chọn bản ghi để SỬA → prefill form từ giá trị hiện tại.
  const onPickRecord = (recordId: string) => {
    setTargetRecordId(recordId);
    if (itemType === 'SECTION_UPDATE' && selectedSection) {
      const rec = records.find((r) => String(r.id) === recordId);
      const draft: Record<string, string> = {};
      if (rec) for (const f of selectedSection.fields) draft[f.name] = toFieldString(f, rec[f.name]);
      setSectionDraft(draft);
    }
  };

  const addExtendedItem = () => {
    if (!selectedField) return toast({ title: 'Chọn trường cần đổi', variant: 'destructive' });
    if (!fieldValue.trim()) return toast({ title: 'Nhập giá trị mới', variant: 'destructive' });
    setItems((p) => [...p, {
      itemType: 'EXTENDED_FIELD', fieldName: selectedField.name,
      label: `${selectedGroup.title} › ${selectedField.label}`, requestedValue: fieldValue.trim(),
    }]);
    setFieldName(''); setFieldValue('');
  };

  const buildSectionPayload = (): Record<string, unknown> | null => {
    if (!selectedSection) return null;
    const payload: Record<string, unknown> = {};
    for (const f of selectedSection.fields) {
      const v = sectionDraft[f.name];
      if (v !== undefined && v !== '') payload[f.name] = v;
    }
    return payload;
  };

  const addSectionCreateItem = () => {
    const payload = buildSectionPayload();
    if (!selectedSection || !payload) return toast({ title: 'Chọn nhóm danh sách', variant: 'destructive' });
    if (Object.keys(payload).length === 0) return toast({ title: 'Nhập ít nhất một trường', variant: 'destructive' });
    setItems((p) => [...p, {
      itemType: 'SECTION_CREATE', sectionSlug: selectedSection.slug,
      label: `Thêm: ${selectedSection.title}`, requestedValue: payload,
    }]);
    setSectionSlug(''); setSectionDraft({});
  };

  const addSectionUpdateItem = () => {
    if (!selectedSection || !targetRecordId) return toast({ title: 'Chọn bản ghi cần sửa', variant: 'destructive' });
    const payload = buildSectionPayload();
    if (!payload || Object.keys(payload).length === 0) return toast({ title: 'Nhập giá trị cần sửa', variant: 'destructive' });
    setItems((p) => [...p, {
      itemType: 'SECTION_UPDATE', sectionSlug: selectedSection.slug, targetRecordId,
      label: `Sửa: ${selectedSection.title}`, requestedValue: payload,
    }]);
    setSectionSlug(''); setSectionDraft({}); setTargetRecordId(''); setRecords([]);
  };

  const addSectionDeleteItem = () => {
    if (!selectedSection || !targetRecordId) return toast({ title: 'Chọn bản ghi cần xóa', variant: 'destructive' });
    const rec = records.find((r) => String(r.id) === targetRecordId);
    setItems((p) => [...p, {
      itemType: 'SECTION_DELETE', sectionSlug: selectedSection.slug, targetRecordId,
      label: `Xóa: ${selectedSection.title}${rec ? ` — ${recordSummary(selectedSection, rec)}` : ''}`,
    }]);
    setSectionSlug(''); setTargetRecordId(''); setRecords([]);
  };

  const addItem = () => {
    if (itemType === 'EXTENDED_FIELD') return addExtendedItem();
    if (itemType === 'SECTION_CREATE') return addSectionCreateItem();
    if (itemType === 'SECTION_UPDATE') return addSectionUpdateItem();
    return addSectionDeleteItem();
  };

  const toApiItem = (it: DraftItem) => {
    switch (it.itemType) {
      case 'EXTENDED_FIELD':
        return { itemType: it.itemType, fieldName: it.fieldName, requestedValue: it.requestedValue };
      case 'SECTION_CREATE':
        return { itemType: it.itemType, sectionSlug: it.sectionSlug, requestedValue: it.requestedValue };
      case 'SECTION_UPDATE':
        return { itemType: it.itemType, sectionSlug: it.sectionSlug, targetRecordId: it.targetRecordId, requestedValue: it.requestedValue };
      case 'SECTION_DELETE':
        return { itemType: it.itemType, sectionSlug: it.sectionSlug, targetRecordId: it.targetRecordId };
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) return toast({ title: 'Chưa có mục thay đổi nào', variant: 'destructive' });
    setSubmitting(true);
    try {
      const createRes = await fetch('/api/profile/change-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ reason: reason || undefined, items: items.map(toApiItem) }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error?.formErrors?.join?.('; ') || createData.error || 'Tạo đề nghị thất bại');
      const requestId = createData.data.id;

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const upRes = await fetch(`/api/profile/change-requests/${requestId}/attachments`, {
          method: 'POST', credentials: 'include', body: fd,
        });
        if (!upRes.ok) throw new Error((await upRes.json()).error || 'Tải minh chứng thất bại');
      }

      const subRes = await fetch(`/api/profile/change-requests/${requestId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action: 'submit' }),
      });
      if (!subRes.ok) throw new Error((await subRes.json()).error || 'Gửi duyệt thất bại');

      toast({ title: 'Đã gửi đề nghị', description: 'Đề nghị đang chờ chỉ huy đơn vị / Ban cán bộ duyệt.' });
      reset();
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecordPicker = () => (
    <div className="grid gap-1">
      <Label>Bản ghi {itemType === 'SECTION_DELETE' ? 'cần xóa' : 'cần sửa'}</Label>
      <Select value={targetRecordId} onValueChange={onPickRecord} disabled={loadingRecords}>
        <SelectTrigger>
          <SelectValue placeholder={loadingRecords ? 'Đang tải...' : records.length ? '-- Chọn bản ghi --' : 'Không có bản ghi'} />
        </SelectTrigger>
        <SelectContent>
          {records.map((r) => (
            <SelectItem key={String(r.id)} value={String(r.id)}>
              {selectedSection ? recordSummary(selectedSection, r) : String(r.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đề nghị cập nhật hồ sơ</DialogTitle>
          <DialogDescription>
            Mọi thay đổi hồ sơ cá nhân phải được Chỉ huy đơn vị và Ban cán bộ/Quân lực duyệt trước khi vào CSDL.
          </DialogDescription>
        </DialogHeader>

        {/* Sub-form thêm mục */}
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid gap-2">
            <Label>Loại thay đổi</Label>
            <Select
              value={itemType}
              onValueChange={(v) => {
                setItemType(v as ItemType);
                setSectionSlug(''); setSectionDraft({}); setTargetRecordId('');
                setRecords([]); setFieldName(''); setFieldValue('');
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ITEM_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {itemType === 'EXTENDED_FIELD' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label>Nhóm</Label>
                <Select value={groupIdx} onValueChange={(v) => { setGroupIdx(v); setFieldName(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXTENDED_FIELD_GROUPS.map((g, i) => <SelectItem key={i} value={String(i)}>{g.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Trường</Label>
                <Select value={fieldName} onValueChange={(v) => { setFieldName(v); setFieldValue(''); }}>
                  <SelectTrigger><SelectValue placeholder="-- Chọn trường --" /></SelectTrigger>
                  <SelectContent>
                    {selectedGroup.fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>{f.label}{f.sensitive ? ' (nhạy cảm)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedField && (
                <div className="grid gap-1 sm:col-span-2">
                  <Label>Giá trị mới</Label>
                  <FieldInput field={selectedField} value={fieldValue} onChange={setFieldValue} />
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label>Nhóm danh sách</Label>
                <Select value={sectionSlug} onValueChange={(v) => { setSectionSlug(v); setSectionDraft({}); setTargetRecordId(''); }}>
                  <SelectTrigger><SelectValue placeholder="-- Chọn nhóm --" /></SelectTrigger>
                  <SelectContent>
                    {CADRE_LIST_SECTIONS.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {needsRecordPicker && selectedSection && renderRecordPicker()}

              {/* Form trường: CREATE luôn hiện; UPDATE hiện sau khi chọn bản ghi */}
              {selectedSection && (itemType === 'SECTION_CREATE' || (itemType === 'SECTION_UPDATE' && targetRecordId)) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedSection.fields.map((f) => (
                    <div key={f.name} className="grid gap-1">
                      <Label className="text-xs">{f.label}{f.required && itemType === 'SECTION_CREATE' ? ' *' : ''}{f.sensitive ? ' (nhạy cảm)' : ''}</Label>
                      <FieldInput field={f} value={sectionDraft[f.name] ?? ''} onChange={(v) => setSectionDraft((p) => ({ ...p, [f.name]: v }))} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-4 w-4" /> Thêm vào đề nghị
          </Button>
        </div>

        {/* Danh sách mục đã thêm */}
        {items.length > 0 && (
          <div className="space-y-2">
            <Label>Các mục thay đổi ({items.length})</Label>
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span>
                  <Badge variant="secondary" className="mr-2">
                    {it.itemType === 'EXTENDED_FIELD' ? 'Sửa'
                      : it.itemType === 'SECTION_CREATE' ? 'Bổ sung'
                      : it.itemType === 'SECTION_UPDATE' ? 'Sửa DS'
                      : 'Xóa DS'}
                  </Badge>
                  {it.label}
                  {it.itemType === 'EXTENDED_FIELD' && <span className="text-muted-foreground"> → {it.requestedValue}</span>}
                </span>
                <Button type="button" variant="ghost" size="icon" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-2">
          <Label>Lý do / ghi chú</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Nêu lý do đề nghị cập nhật..." />
        </div>

        <div className="grid gap-2">
          <Label className="flex items-center gap-1"><Paperclip className="h-4 w-4" /> Minh chứng đính kèm</Label>
          <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} tệp đã chọn</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting || items.length === 0}>
            <Send className="mr-1 h-4 w-4" /> {submitting ? 'Đang gửi...' : 'Gửi duyệt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
