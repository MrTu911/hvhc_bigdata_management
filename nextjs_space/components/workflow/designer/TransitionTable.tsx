'use client';

/**
 * M13 – Transition Table
 * Bảng quản lý transition rules của một workflow version.
 * Mỗi transition: fromStep → actionCode → toStep
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { StepDraft } from './StepFormPanel';

export interface TransitionDraft {
  id: string; // local client-side ID
  fromStepCode: string;
  actionCode: string;
  toStepCode: string;
  priority: number;
}

interface TransitionTableProps {
  transitions: TransitionDraft[];
  steps: StepDraft[];
  readonly: boolean;
  onAdd: (t: Omit<TransitionDraft, 'id'>) => void;
  onDelete: (id: string) => void;
  /** Called when canvas connects two nodes */
  pendingConnect: { fromCode: string; toCode: string } | null;
  onClearPendingConnect: () => void;
}

const ACTION_CODE_OPTIONS = [
  { value: 'SUBMIT',  label: 'SUBMIT – Nộp' },
  { value: 'APPROVE', label: 'APPROVE – Phê duyệt' },
  { value: 'REJECT',  label: 'REJECT – Từ chối' },
  { value: 'RETURN',  label: 'RETURN – Trả lại' },
  { value: 'SIGN',    label: 'SIGN – Ký số' },
  { value: 'CANCEL',  label: 'CANCEL – Hủy' },
  { value: 'REASSIGN',label: 'REASSIGN – Phân công lại' },
  { value: 'ESCALATE',label: 'ESCALATE – Thúc đẩy' },
  { value: 'SYSTEM_TIMEOUT', label: 'SYSTEM_TIMEOUT – Hết hạn' },
];

const EMPTY_FORM = { fromStepCode: '', actionCode: 'APPROVE', toStepCode: '', priority: 0 };

export function TransitionTable({
  transitions,
  steps,
  readonly,
  onAdd,
  onDelete,
  pendingConnect,
  onClearPendingConnect,
}: TransitionTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<TransitionDraft, 'id'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // When canvas creates a connection, pre-fill fromStepCode + toStepCode
  if (pendingConnect && !showForm) {
    setShowForm(true);
    setForm({ ...EMPTY_FORM, fromStepCode: pendingConnect.fromCode, toStepCode: pendingConnect.toCode });
    onClearPendingConnect();
  }

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.fromStepCode) errs.fromStepCode = 'Bắt buộc';
    if (!form.toStepCode) errs.toStepCode = 'Bắt buộc';
    if (form.fromStepCode === form.toStepCode) errs.toStepCode = 'Bước đến phải khác bước đi';
    const dup = transitions.find(
      (t) => t.fromStepCode === form.fromStepCode && t.actionCode === form.actionCode && t.toStepCode === form.toStepCode
    );
    if (dup) errs.actionCode = 'Transition này đã tồn tại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onAdd({ ...form });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setErrors({});
  };

  const stepOptions = steps.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Transitions ({transitions.length})</p>
        {!readonly && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3" />
            Thêm
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && !readonly && (
        <div className="rounded-lg border bg-blue-50/40 p-3 space-y-3">
          <p className="text-xs font-semibold text-blue-700">Thêm transition</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Từ bước *</Label>
              <Select
                value={form.fromStepCode}
                onValueChange={(v) => { setForm(f => ({ ...f, fromStepCode: v })); setErrors(er => ({ ...er, fromStepCode: undefined })); }}
              >
                <SelectTrigger className={cn('h-7 text-xs', errors.fromStepCode && 'border-red-400')}>
                  <SelectValue placeholder="Chọn bước..." />
                </SelectTrigger>
                <SelectContent>
                  {stepOptions.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fromStepCode && <p className="text-[11px] text-red-500">{errors.fromStepCode}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hành động *</Label>
              <Select
                value={form.actionCode}
                onValueChange={(v) => { setForm(f => ({ ...f, actionCode: v })); setErrors(er => ({ ...er, actionCode: undefined })); }}
              >
                <SelectTrigger className={cn('h-7 text-xs', errors.actionCode && 'border-red-400')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_CODE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.actionCode && <p className="text-[11px] text-red-500">{errors.actionCode}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Đến bước *</Label>
              <Select
                value={form.toStepCode}
                onValueChange={(v) => { setForm(f => ({ ...f, toStepCode: v })); setErrors(er => ({ ...er, toStepCode: undefined })); }}
              >
                <SelectTrigger className={cn('h-7 text-xs', errors.toStepCode && 'border-red-400')}>
                  <SelectValue placeholder="Chọn bước..." />
                </SelectTrigger>
                <SelectContent>
                  {stepOptions.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.toStepCode && <p className="text-[11px] text-red-500">{errors.toStepCode}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Thêm</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowForm(false); setErrors({}); setForm(EMPTY_FORM); }}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Transition list */}
      {transitions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          Chưa có transition. Thêm để xác định luồng chuyển bước.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs py-2 h-auto">Từ bước</TableHead>
              <TableHead className="text-xs py-2 h-auto">Hành động</TableHead>
              <TableHead className="text-xs py-2 h-auto">Đến bước</TableHead>
              {!readonly && <TableHead className="w-8 py-2 h-auto" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transitions.map((t) => (
              <TableRow key={t.id} className="text-xs">
                <TableCell className="py-1.5">
                  <code className="bg-muted px-1 rounded text-[11px]">{t.fromStepCode}</code>
                </TableCell>
                <TableCell className="py-1.5">
                  <span className="text-violet-700 font-medium">{t.actionCode}</span>
                </TableCell>
                <TableCell className="py-1.5">
                  <code className="bg-muted px-1 rounded text-[11px]">{t.toStepCode}</code>
                </TableCell>
                {!readonly && (
                  <TableCell className="py-1.5">
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1 rounded hover:bg-red-100 text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
