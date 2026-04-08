'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, X, ChevronDown } from 'lucide-react';

// ─── Grade config ─────────────────────────────────────
export const REVIEW_GRADES = [
  { value: 'HTXSNV', label: 'Hoàn thành xuất sắc nhiệm vụ', short: 'HTXSNV', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  { value: 'HTTNV',  label: 'Hoàn thành tốt nhiệm vụ',      short: 'HTTNV',  badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300' },
  { value: 'HTNV',   label: 'Hoàn thành nhiệm vụ',           short: 'HTNV',   badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300' },
  { value: 'KHNV',   label: 'Không hoàn thành nhiệm vụ',     short: 'KHNV',   badgeClass: 'bg-red-100 text-red-800 border border-red-300' },
];

// ─── Types ────────────────────────────────────────────
interface PartyMemberOption {
  id: string;
  user: { name: string; militaryId?: string | null; rank?: string | null; unitRelation?: { name: string } | null };
}

export interface ReviewFormPayload {
  partyMemberId: string;
  reviewYear: number;
  grade: string;
  comments: string;
  evidenceUrl: string;
}

interface ReviewFormProps {
  onSubmit: (payload: ReviewFormPayload) => Promise<void> | void;
  submitting?: boolean;
  initialValues?: Partial<ReviewFormPayload & { partyMemberName?: string }>;
  mode?: 'create' | 'edit';
}

// ─── Member search combobox ───────────────────────────
function MemberCombobox({
  value,
  displayName,
  onChange,
  disabled,
}: {
  value: string;
  displayName: string;
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PartyMemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '20', ...(query && { search: query }) });
        const res = await fetch(`/api/party/members?${params}`);
        const json = await res.json();
        setResults(json.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(member: PartyMemberOption) {
    onChange(member.id, member.user.name);
    setOpen(false);
    setQuery('');
  }

  function handleClear() {
    onChange('', '');
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {displayName || 'Tìm và chọn đảng viên...'}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              title="Xóa lựa chọn"
              aria-label="Xóa lựa chọn"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="flex items-center border-b px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Nhập tên hoặc mã quân nhân..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-52 overflow-y-auto">
            {results.length === 0 && !loading && (
              <div className="py-4 text-center text-sm text-muted-foreground">Không tìm thấy kết quả</div>
            )}
            {results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(m)}
                className="w-full flex flex-col items-start gap-0.5 px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left"
              >
                <span className="font-medium">{m.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[m.user.militaryId, m.user.rank, m.user.unitRelation?.name].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────
export function ReviewForm({ onSubmit, submitting, initialValues, mode = 'create' }: ReviewFormProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const [form, setForm] = useState<ReviewFormPayload>({
    partyMemberId: initialValues?.partyMemberId ?? '',
    reviewYear: initialValues?.reviewYear ?? currentYear,
    grade: initialValues?.grade ?? 'HTTNV',
    comments: initialValues?.comments ?? '',
    evidenceUrl: initialValues?.evidenceUrl ?? '',
  });
  const [memberDisplayName, setMemberDisplayName] = useState(initialValues?.partyMemberName ?? '');

  function set<K extends keyof ReviewFormPayload>(k: K, v: ReviewFormPayload[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit() {
    if (!form.partyMemberId && mode === 'create') return;
    onSubmit({ ...form });
  }

  const isValid = mode === 'edit' ? !!form.grade : !!form.partyMemberId && !!form.grade;

  return (
    <div className="space-y-4">
      {/* Member picker — only in create mode */}
      {mode === 'create' && (
        <div className="space-y-1.5">
          <Label>Đảng viên <span className="text-destructive">*</span></Label>
          <MemberCombobox
            value={form.partyMemberId}
            displayName={memberDisplayName}
            onChange={(id, name) => { set('partyMemberId', id); setMemberDisplayName(name); }}
          />
          {!form.partyMemberId && (
            <p className="text-xs text-muted-foreground">Chọn đảng viên cần tạo đánh giá</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Year */}
        <div className="space-y-1.5">
          <Label>Năm đánh giá <span className="text-destructive">*</span></Label>
          <select
            title="Năm đánh giá"
            aria-label="Năm đánh giá"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.reviewYear}
            onChange={(e) => set('reviewYear', Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Grade */}
        <div className="space-y-1.5">
          <Label>Xếp loại <span className="text-destructive">*</span></Label>
          <select
            title="Xếp loại"
            aria-label="Xếp loại"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
          >
            {REVIEW_GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.short} – {g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grade badge preview */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Xem trước xếp loại:</span>
        {(() => {
          const g = REVIEW_GRADES.find((x) => x.value === form.grade);
          return g ? (
            <Badge className={g.badgeClass}>{g.short}</Badge>
          ) : null;
        })()}
      </div>

      {/* Evidence URL */}
      <div className="space-y-1.5">
        <Label>Minh chứng (URL)</Label>
        <Input
          value={form.evidenceUrl}
          onChange={(e) => set('evidenceUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Comments */}
      <div className="space-y-1.5">
        <Label>Nhận xét</Label>
        <Textarea
          value={form.comments}
          onChange={(e) => set('comments', e.target.value)}
          rows={3}
          placeholder="Nhận xét về quá trình phấn đấu, thực hiện nhiệm vụ..."
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button
          disabled={submitting || !isValid}
          onClick={handleSubmit}
          className="min-w-24"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {mode === 'create' ? 'Tạo đánh giá' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  );
}
