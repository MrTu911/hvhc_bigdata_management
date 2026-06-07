'use client'

/**
 * PersonnelCombobox – chọn cán bộ bằng tìm kiếm phía server.
 *
 * Trả về đúng `Personnel.id` (FK), tránh lỗi nhập tay mã cán bộ ở các form
 * cần personnelId. Tôn trọng scope vì gọi /api/personnel/search (scope-aware).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, Search, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { getRankLabel } from '@/lib/constants/rank-declaration'

export interface PersonnelOption {
  id: string
  fullName: string
  personnelCode: string
  militaryRank: string | null
  unit: { id: string; name: string } | null
}

interface PersonnelComboboxProps {
  value: PersonnelOption | null
  onChange: (personnel: PersonnelOption | null) => void
  /** id Personnel để preload sẵn khi mở form từ liên kết (?personnelId=) */
  initialId?: string | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

function mapPersonnel(p: any): PersonnelOption {
  return {
    id: p.id,
    fullName: p.fullName,
    personnelCode: p.personnelCode,
    militaryRank: p.militaryRank ?? null,
    unit: p.unit ? { id: p.unit.id, name: p.unit.name } : null,
  }
}

export function PersonnelCombobox({
  value,
  onChange,
  initialId,
  placeholder = 'Tìm cán bộ theo tên hoặc mã...',
  disabled,
  className,
}: PersonnelComboboxProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [options, setOptions] = useState<PersonnelOption[]>([])
  const [loading, setLoading] = useState(false)
  const [preloading, setPreloading] = useState(!!initialId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const preloadedRef = useRef(false)

  // Preload: nạp sẵn cán bộ theo initialId (một lần) để hiển thị tên trên trigger.
  useEffect(() => {
    if (!initialId || preloadedRef.current || value) {
      setPreloading(false)
      return
    }
    preloadedRef.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/personnel/search?personnelId=${encodeURIComponent(initialId)}`)
        const json = await res.json()
        const first = json?.success && Array.isArray(json.data) ? json.data[0] : null
        if (!cancelled && first) onChange(mapPersonnel(first))
      } catch {
        /* im lặng: người dùng vẫn có thể tự chọn lại */
      } finally {
        if (!cancelled) setPreloading(false)
      }
    })()
    return () => { cancelled = true }
  }, [initialId, value, onChange])

  const fetchOptions = useCallback(async (kw: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '15' })
      if (kw.trim()) params.set('keyword', kw.trim())
      const res = await fetch(`/api/personnel/search?${params}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setOptions(json.data.map(mapPersonnel))
      } else {
        setOptions([])
      }
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce tìm kiếm khi gõ; tải sẵn danh sách đầu khi mở popover.
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchOptions(keyword), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword, open, fetchOptions])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || preloading}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {preloading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải cán bộ...
            </span>
          ) : value ? (
            <span className="flex items-center gap-2 truncate">
              <UserRound className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="truncate">
                {value.fullName}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {value.personnelCode}
                </span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Chọn cán bộ
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        {/* shouldFilter=false: lọc đã do server làm, tránh cmdk lọc lại theo text */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={keyword}
            onValueChange={setKeyword}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tìm...
              </div>
            ) : (
              <>
                <CommandEmpty>Không tìm thấy cán bộ phù hợp.</CommandEmpty>
                <CommandGroup>
                  {options.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onChange(p)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0 text-blue-600',
                          value?.id === p.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{p.fullName}</span>
                          {p.militaryRank && (
                            <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                              {getRankLabel(p.militaryRank)}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {p.personnelCode}
                          {p.unit?.name ? ` · ${p.unit.name}` : ''}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
