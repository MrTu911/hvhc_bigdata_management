'use client';

/**
 * M13 – Step Form Panel
 * Panel bên trái: danh sách steps + form thêm/sửa step.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';

export type StepType = 'START' | 'TASK' | 'APPROVAL' | 'SIGNATURE' | 'END';

export interface StepDraft {
  code: string;
  name: string;
  stepType: StepType;
  orderIndex: number;
  slaHours?: number;
  requiresSignature?: boolean;
  isParallel?: boolean;
}

interface StepFormPanelProps {
  steps: StepDraft[];
  selectedCode: string | null;
  readonly: boolean;
  onAdd: (step: StepDraft) => void;
  onUpdate: (code: string, updates: Partial<StepDraft>) => void;
  onDelete: (code: string) => void;
  onSelect: (code: string | null) => void;
  onMoveUp: (code: string) => void;
  onMoveDown: (code: string) => void;
}

const STEP_TYPE_OPTIONS: { value: StepType; label: string }[] = [
  { value: 'START',     label: 'Bắt đầu (START)' },
  { value: 'TASK',      label: 'Tác vụ (TASK)' },
  { value: 'APPROVAL',  label: 'Phê duyệt (APPROVAL)' },
  { value: 'SIGNATURE', label: 'Ký số (SIGNATURE)' },
  { value: 'END',       label: 'Kết thúc (END)' },
];

const STEP_TYPE_COLOR: Record<StepType, string> = {
  START:     'bg-green-100 text-green-700 border-green-300',
  TASK:      'bg-blue-50 text-blue-700 border-blue-300',
  APPROVAL:  'bg-violet-50 text-violet-700 border-violet-300',
  SIGNATURE: 'bg-teal-50 text-teal-700 border-teal-300',
  END:       'bg-red-100 text-red-700 border-red-300',
};

const EMPTY_FORM: Omit<StepDraft, 'orderIndex'> = {
  code: '',
  name: '',
  stepType: 'TASK',
  slaHours: undefined,
  requiresSignature: false,
  isParallel: false,
};

export function StepFormPanel({
  steps,
  selectedCode,
  readonly,
  onAdd,
  onUpdate,
  onDelete,
  onSelect,
  onMoveUp,
  onMoveDown,
}: StepFormPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<StepDraft, 'orderIndex'>>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StepDraft, string>>>({});

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.code.trim()) errs.code = 'Bắt buộc';
    else if (!/^[A-Z0-9_]{2,30}$/.test(form.code))
      errs.code = 'A-Z, 0-9, _ (2-30 ký tự)';
    else if (!editCode && steps.some((s) => s.code === form.code))
      errs.code = 'Code đã tồn tại';
    if (!form.name.trim()) errs.name = 'Bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editCode) {
      onUpdate(editCode, { name: form.name, stepType: form.stepType, slaHours: form.slaHours, requiresSignature: form.requiresSignature });
    } else {
      onAdd({
        ...form,
        code: form.code.trim(),
        name: form.name.trim(),
        orderIndex: steps.length,
      });
    }
    resetForm();
  };

  const handleEdit = (step: StepDraft) => {
    setForm({ code: step.code, name: step.name, stepType: step.stepType, slaHours: step.slaHours, requiresSignature: step.requiresSignature });
    setEditCode(step.code);
    setShowForm(true);
    setErrors({});
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditCode(null);
    setShowForm(false);
    setErrors({});
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30 flex-shrink-0">
        <span className="text-sm font-semibold">Bước ({steps.length})</span>
        {!readonly && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => { setShowForm(true); setEditCode(null); setForm(EMPTY_FORM); }}
          >
            <Plus className="h-3 w-3" />
            Thêm
          </Button>
        )}
      </div>

      {/* Inline form */}
      {showForm && !readonly && (
        <div className="px-3 py-3 border-b bg-blue-50/40 space-y-2.5 flex-shrink-0">
          <p className="text-xs font-semibold text-blue-700">
            {editCode ? `Sửa bước: ${editCode}` : 'Thêm bước mới'}
          </p>

          {/* Code — chỉ cho phép nhập khi tạo mới */}
          {!editCode && (
            <div className="space-y-1">
              <Label className="text-xs">Mã bước *</Label>
              <Input
                value={form.code}
                onChange={(e) => { setForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setErrors(er => ({ ...er, code: undefined })); }}
                placeholder="VD: REVIEW_LEADER"
                className={cn('h-7 text-xs', errors.code && 'border-red-400')}
              />
              {errors.code && <p className="text-[11px] text-red-500">{errors.code}</p>}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs">Tên bước *</Label>
            <Input
              value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
              placeholder="VD: Trưởng đơn vị duyệt"
              className={cn('h-7 text-xs', errors.name && 'border-red-400')}
            />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
          </div>

          {/* Step type */}
          <div className="space-y-1">
            <Label className="text-xs">Loại bước</Label>
            <Select
              value={form.stepType}
              onValueChange={(v) => setForm(f => ({ ...f, stepType: v as StepType }))}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SLA */}
          <div className="space-y-1">
            <Label className="text-xs">SLA (giờ)</Label>
            <Input
              type="number"
              min={0}
              value={form.slaHours ?? ''}
              onChange={(e) => setForm(f => ({ ...f, slaHours: e.target.value ? parseInt(e.target.value) : undefined }))}
              placeholder="Để trống nếu không giới hạn"
              className="h-7 text-xs"
            />
          </div>

          {/* requiresSignature */}
          {form.stepType === 'SIGNATURE' && (
            <div className="flex items-center gap-2">
              <input
                id="reqSig"
                type="checkbox"
                checked={form.requiresSignature ?? false}
                onChange={(e) => setForm(f => ({ ...f, requiresSignature: e.target.checked }))}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="reqSig" className="text-xs">Yêu cầu ký số</Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave}>
              {editCode ? 'Cập nhật' : 'Thêm bước'}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={resetForm}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Step list */}
      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Chưa có bước nào.
          </p>
        ) : (
          <ul className="divide-y">
            {steps.map((step, idx) => (
              <li
                key={step.code}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 hover:bg-muted/40 cursor-pointer group transition-colors',
                  selectedCode === step.code && 'bg-blue-50'
                )}
                onClick={() => onSelect(step.code === selectedCode ? null : step.code)}
              >
                {/* Order index badge */}
                <span className="flex-shrink-0 text-xs text-muted-foreground w-5 text-right">
                  {idx + 1}
                </span>

                {/* Type badge */}
                <span className={cn(
                  'flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium',
                  STEP_TYPE_COLOR[step.stepType]
                )}>
                  {step.stepType.slice(0, 3)}
                </span>

                {/* Name + code */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{step.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{step.code}</p>
                </div>

                {/* Actions — only visible on hover, hidden for readonly */}
                {!readonly && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveUp(step.code); }}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      title="Lên"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveDown(step.code); }}
                      disabled={idx === steps.length - 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      title="Xuống"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(step); }}
                      className="p-1 rounded hover:bg-muted"
                      title="Sửa"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(step.code); }}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                      title="Xóa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
