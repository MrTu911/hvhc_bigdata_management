'use client';

/**
 * EntityPicker – M18
 * Combobox tìm đối tượng (cán bộ/học viên/đảng viên) theo tên hoặc mã để preview/export.
 *
 * - Tìm server-side qua /api/templates/export/entities (debounce 250ms).
 * - onChange trả về id nội bộ (cuid) của đối tượng đã chọn.
 * - Vẫn cho phép nhập tay mã quân nhân / mã học viên / ID (escape hatch).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface EntityOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface EntityPickerProps {
  entityType: string;
  /** id (cuid) đang chọn, hoặc giá trị nhập tay */
  value: string;
  onChange: (id: string, label?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EntityPicker({
  entityType,
  value,
  onChange,
  placeholder = 'Tìm theo tên hoặc mã...',
  disabled,
}: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset nhãn hiển thị khi parent xóa value hoặc đổi entityType
  useEffect(() => {
    if (!value) setSelectedLabel('');
  }, [value]);

  useEffect(() => {
    // Đổi loại đối tượng → làm mới kết quả
    setOptions([]);
    setQuery('');
  }, [entityType]);

  const fetchOptions = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ entityType, q, limit: '10' });
        const res = await fetch(`/api/templates/export/entities?${params}`);
        const json = await res.json();
        if (res.ok && json.success) setOptions(json.data || []);
        else setOptions([]);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [entityType],
  );

  // Debounce theo query khi popover mở
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOptions(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, fetchOptions]);

  const handleSelect = (opt: EntityOption) => {
    onChange(opt.id, opt.label);
    setSelectedLabel(opt.label);
    setOpen(false);
  };

  const handleManual = () => {
    const raw = query.trim();
    if (!raw) return;
    onChange(raw, raw);
    setSelectedLabel(raw);
    setOpen(false);
  };

  const buttonLabel = value ? selectedLabel || value : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        >
          <span className="truncate">{buttonLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nhập tên hoặc mã..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang tìm...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {query.trim()
                    ? 'Không tìm thấy. Có thể dùng đúng mã/ID bên dưới.'
                    : 'Nhập tên hoặc mã để tìm.'}
                </CommandEmpty>
                {options.length > 0 && (
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem key={opt.id} value={opt.id} onSelect={() => handleSelect(opt)}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === opt.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {query.trim() && (
                  <CommandGroup heading="Nhập tay">
                    <CommandItem value={`__manual__${query}`} onSelect={handleManual}>
                      <span className="text-sm">
                        Dùng mã/ID: <span className="font-mono">{query.trim()}</span>
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
