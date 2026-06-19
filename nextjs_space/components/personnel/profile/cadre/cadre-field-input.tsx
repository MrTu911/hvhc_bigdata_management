'use client';

/**
 * Render 1 input theo metadata field của registry hồ sơ cán bộ điện tử.
 * Dùng chung cho dialog thêm/sửa (section card) và form thông tin mở rộng.
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CadreField } from '@/lib/constants/cadre-profile-sections';

/** Chuyển ISO datetime / Date → 'yyyy-mm-dd' cho <input type="date">. */
export function toDateInputValue(v: unknown): string {
  if (!v) return '';
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

interface CadreFieldInputProps {
  field: CadreField;
  value: unknown;
  disabled?: boolean;
  onChange: (name: string, value: unknown) => void;
}

export function CadreFieldInput({ field, value, disabled, onChange }: CadreFieldInputProps) {
  const id = `fld-${field.name}`;
  const label = (
    <Label htmlFor={id} className="text-sm">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
      {field.sensitive && <span className="ml-1 text-xs text-amber-600">(nhạy cảm)</span>}
    </Label>
  );

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-2 py-1">
        {label}
        <Switch
          id={id}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(c) => onChange(field.name, c)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label}
      {field.type === 'textarea' ? (
        <Textarea
          id={id}
          value={(value as string) ?? ''}
          disabled={disabled}
          rows={2}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      ) : field.type === 'select' ? (
        <Select
          value={(value as string) ?? ''}
          disabled={disabled}
          onValueChange={(v) => onChange(field.name, v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="-- Chọn --" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'date' ? (
        <Input
          id={id}
          type="date"
          value={toDateInputValue(value)}
          disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === 'number' || field.type === 'decimal' ? 'number' : 'text'}
          step={field.type === 'decimal' ? '0.01' : undefined}
          value={(value as string | number) ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )}
    </div>
  );
}
