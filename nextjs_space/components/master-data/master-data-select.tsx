'use client'

/**
 * MasterDataSelect – generic dropdown that pulls from MDM.
 * Usage:
 *   <MasterDataSelect categoryCode="MD_RANK" value={val} onChange={setVal} />
 */

import { useMasterData } from '@/hooks/use-master-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  categoryCode: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  parentCode?: string     // filter children of a specific parent
  showCode?: boolean      // show code in brackets
}

export function MasterDataSelect({
  categoryCode,
  value,
  onChange,
  placeholder = 'Chọn...',
  disabled = false,
  className,
  parentCode,
  showCode = false,
}: Props) {
  const { items, loading } = useMasterData(categoryCode)

  const filtered = parentCode ? items.filter(i => i.parentCode === parentCode) : items

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? 'Đang tải...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filtered.map(item => (
          <SelectItem key={item.code} value={item.code}>
            {showCode ? `[${item.code}] ${item.nameVi}` : item.nameVi}
          </SelectItem>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">Không có dữ liệu</div>
        )}
      </SelectContent>
    </Select>
  )
}
