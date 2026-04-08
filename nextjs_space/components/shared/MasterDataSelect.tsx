'use client'

/**
 * MasterDataSelect – M19 MDM
 * Dropdown dùng chung cho toàn hệ thống, đọc dữ liệu từ MDM.
 *
 * Hỗ trợ:
 *   - searchable  : input lọc tức thì
 *   - multiple    : chọn nhiều, trả string[]
 *   - hierarchical: hiển thị thụt lề theo level/parentCode
 *   - parentCode  : lọc con của 1 cha cụ thể
 *   - showCode    : hiển thị [CODE] trước tên
 *
 * Usage đơn giản (single, không search):
 *   <MasterDataSelect categoryCode="MD_RANK" value={val} onChange={setVal} />
 *
 * Usage nâng cao (multiple, searchable):
 *   <MasterDataSelect
 *     categoryCode="MD_ETHNICITY"
 *     multiple
 *     searchable
 *     values={vals}
 *     onChangeMultiple={setVals}
 *   />
 */

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMasterData, type MdItem } from '@/hooks/use-master-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// ─── Types ────────────────────────────────────────────────────────────────────

type SingleProps = {
  multiple?: false
  value?: string
  onChange?: (value: string) => void
  values?: never
  onChangeMultiple?: never
}

type MultipleProps = {
  multiple: true
  values?: string[]
  onChangeMultiple?: (values: string[]) => void
  value?: never
  onChange?: never
}

type CommonProps = {
  categoryCode: string
  placeholder?: string
  searchable?: boolean
  hierarchical?: boolean
  parentCode?: string
  showCode?: boolean
  disabled?: boolean
  className?: string
  emptyText?: string
}

type Props = CommonProps & (SingleProps | MultipleProps)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLabel(item: MdItem, showCode: boolean): string {
  return showCode ? `[${item.code}] ${item.nameVi}` : item.nameVi
}

/**
 * Sắp xếp items theo cây: cha trước con, con thụt lề sau cha.
 * Nếu không hierarchical, trả nguyên bản theo sortOrder.
 */
function toHierarchicalList(
  items: MdItem[]
): Array<MdItem & { depth: number }> {
  const byCode = new Map(items.map(i => [i.code, i]))
  const result: Array<MdItem & { depth: number }> = []

  function getDepth(item: MdItem): number {
    if (!item.parentCode || !byCode.has(item.parentCode)) return 0
    return 1 + getDepth(byCode.get(item.parentCode)!)
  }

  // roots first, then children sorted under parent
  const roots = items.filter(i => !i.parentCode || !byCode.has(i.parentCode))
  const children = items.filter(i => i.parentCode && byCode.has(i.parentCode))

  function appendWithChildren(item: MdItem) {
    result.push({ ...item, depth: getDepth(item) })
    children.filter(c => c.parentCode === item.code).forEach(appendWithChildren)
  }

  roots.forEach(appendWithChildren)
  // Safety: if any item was orphaned, append at depth 0
  const seen = new Set(result.map(r => r.code))
  for (const item of children) {
    if (!seen.has(item.code)) result.push({ ...item, depth: 0 })
  }
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MasterDataSelect(props: Props) {
  const {
    categoryCode,
    placeholder = 'Chọn...',
    searchable = false,
    hierarchical = false,
    parentCode,
    showCode = false,
    disabled = false,
    className,
    emptyText = 'Không có dữ liệu',
  } = props

  const [open, setOpen] = useState(false)
  const { items, isLoading } = useMasterData(categoryCode)

  // ── Filter by parentCode if provided ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = items
    if (parentCode !== undefined) {
      list = list.filter(i => i.parentCode === parentCode)
    }
    return list
  }, [items, parentCode])

  // ── Build display list (flat or hierarchical) ─────────────────────────────
  const displayList = useMemo(
    () => (hierarchical ? toHierarchicalList(filtered) : filtered.map(i => ({ ...i, depth: 0 }))),
    [filtered, hierarchical]
  )

  // ── Single select ─────────────────────────────────────────────────────────
  if (!props.multiple) {
    const { value, onChange } = props
    const selectedItem = items.find(i => i.code === value)

    const handleSelect = (code: string) => {
      onChange?.(code === value ? '' : code)
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className={cn('w-full justify-between font-normal', className)}
          >
            <span className="truncate">
              {isLoading
                ? 'Đang tải...'
                : selectedItem
                ? buildLabel(selectedItem, showCode)
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            {searchable && <CommandInput placeholder="Tìm kiếm..." />}
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {displayList.map(item => (
                  <CommandItem
                    key={item.code}
                    value={`${item.code} ${item.nameVi} ${item.nameEn ?? ''}`}
                    onSelect={() => handleSelect(item.code)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span style={{ paddingLeft: `${item.depth * 16}px` }}>
                      {buildLabel(item, showCode)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // ── Multiple select ───────────────────────────────────────────────────────
  const { values = [], onChangeMultiple } = props

  const handleToggle = (code: string) => {
    const next = values.includes(code)
      ? values.filter(v => v !== code)
      : [...values, code]
    onChangeMultiple?.(next)
  }

  const removeOne = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChangeMultiple?.(values.filter(v => v !== code))
  }

  const selectedItems = items.filter(i => values.includes(i.code))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full min-h-9 h-auto justify-start font-normal flex-wrap gap-1',
            className
          )}
        >
          {isLoading ? (
            <span className="text-muted-foreground">Đang tải...</span>
          ) : selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map(item => (
              <Badge key={item.code} variant="secondary" className="gap-1">
                {buildLabel(item, showCode)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={e => removeOne(item.code, e)}
                />
              </Badge>
            ))
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder="Tìm kiếm..." />}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {displayList.map(item => (
                <CommandItem
                  key={item.code}
                  value={`${item.code} ${item.nameVi} ${item.nameEn ?? ''}`}
                  onSelect={() => handleToggle(item.code)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      values.includes(item.code) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span style={{ paddingLeft: `${item.depth * 16}px` }}>
                    {buildLabel(item, showCode)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
