'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, X, User } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
interface MemberSuggestion {
  id: string;
  user: { id: string; name: string; militaryId?: string | null; rank?: string | null };
  partyCell?: string | null;
}

export interface AwardFormValues {
  partyMemberId: string;
  title: string;
  decisionNo: string;
  decisionDate: string;
  issuer: string;
  note: string;
  attachmentUrl: string;
}

interface AwardFormProps {
  initial?: Partial<AwardFormValues> & {
    partyMemberName?: string;
    partyMemberMilitaryId?: string;
  };
  editMode?: boolean;
  submitting?: boolean;
  onSubmit: (values: AwardFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

// ─── MemberSearch ────────────────────────────────────────────────────────────
function MemberSearch({
  value,
  displayName,
  onSelect,
  disabled,
}: {
  value: string;
  displayName: string;
  onSelect: (id: string, name: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/party-members?search=${encodeURIComponent(query)}&limit=8`);
        const json = await res.json();
        setResults(json?.members ?? []);
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Selected state
  if (value && displayName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2">
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
        </div>
        {!disabled && (
          <button type="button" onClick={() => onSelect('', '')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {searching
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        }
        <Input
          placeholder="Tìm tên, mã quân nhân..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-56 overflow-y-auto">
          {results.map(m => (
            <button
              key={m.id}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              onClick={() => {
                onSelect(m.id, m.user.name);
                setQuery('');
                setOpen(false);
              }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                {(m.user.name ?? '?').split(' ').slice(-1)[0]?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.user.name}</p>
                <p className="text-xs text-gray-400 truncate">{m.user.militaryId ?? ''} · {m.user.rank ?? ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && !searching && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-3 text-sm text-gray-400">
          Không tìm thấy đảng viên
        </div>
      )}
    </div>
  );
}

// ─── AwardForm ───────────────────────────────────────────────────────────────
export function AwardForm({ initial, editMode = false, submitting, onSubmit, onCancel }: AwardFormProps) {
  const [form, setForm] = useState<AwardFormValues>({
    partyMemberId: initial?.partyMemberId ?? '',
    title: initial?.title ?? '',
    decisionNo: initial?.decisionNo ?? '',
    decisionDate: initial?.decisionDate ?? '',
    issuer: initial?.issuer ?? '',
    note: initial?.note ?? '',
    attachmentUrl: initial?.attachmentUrl ?? '',
  });
  const [memberName, setMemberName] = useState(initial?.partyMemberName ?? '');
  const [errors, setErrors] = useState<Partial<Record<keyof AwardFormValues, string>>>({});

  const set = <K extends keyof AwardFormValues>(key: K, val: AwardFormValues[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.partyMemberId) errs.partyMemberId = 'Vui lòng chọn đảng viên';
    if (!form.title.trim()) errs.title = 'Tiêu đề khen thưởng là bắt buộc';
    if (form.attachmentUrl && !/^https?:\/\//.test(form.attachmentUrl)) {
      errs.attachmentUrl = 'URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <div className="space-y-4">
      {/* Member selection */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Đảng viên <span className="text-red-500">*</span>
        </Label>
        {editMode ? (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{memberName || '—'}</span>
          </div>
        ) : (
          <MemberSearch
            value={form.partyMemberId}
            displayName={memberName}
            onSelect={(id, name) => { set('partyMemberId', id); setMemberName(name); }}
          />
        )}
        {errors.partyMemberId && <p className="text-xs text-red-500 mt-1">{errors.partyMemberId}</p>}
      </div>

      {/* Title */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">
          Danh hiệu / Thành tích khen thưởng <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="VD: Chiến sĩ thi đua cơ sở, Bằng khen Bộ Quốc phòng..."
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className={errors.title ? 'border-red-400' : ''}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* Decision No + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Số quyết định</Label>
          <Input
            placeholder="VD: 123/QĐ-HVHC"
            value={form.decisionNo}
            onChange={e => set('decisionNo', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Ngày quyết định</Label>
          <Input
            type="date"
            value={form.decisionDate}
            onChange={e => set('decisionDate', e.target.value)}
          />
        </div>
      </div>

      {/* Issuer */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Cấp ra quyết định</Label>
        <Input
          placeholder="VD: Ban Thường vụ Đảng ủy HVHC, Bộ Quốc phòng..."
          value={form.issuer}
          onChange={e => set('issuer', e.target.value)}
        />
      </div>

      {/* Attachment URL */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Đường dẫn tài liệu đính kèm</Label>
        <Input
          placeholder="https://..."
          value={form.attachmentUrl}
          onChange={e => set('attachmentUrl', e.target.value)}
          className={errors.attachmentUrl ? 'border-red-400' : ''}
        />
        {errors.attachmentUrl && <p className="text-xs text-red-500 mt-1">{errors.attachmentUrl}</p>}
      </div>

      {/* Note */}
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Ghi chú</Label>
        <Textarea
          rows={3}
          placeholder="Thông tin bổ sung về quyết định khen thưởng..."
          value={form.note}
          onChange={e => set('note', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Hủy
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          {editMode ? 'Cập nhật' : 'Lưu khen thưởng'}
        </Button>
      </div>
    </div>
  );
}
