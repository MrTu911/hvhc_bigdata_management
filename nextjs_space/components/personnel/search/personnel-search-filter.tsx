'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonnelSearchFilterValues {
  keyword: string
  category: string
  status: string
  rank: string
  position: string
  degree: string
  academicTitle: string
  major: string
  politicalTheory: string
  unitId: string
  ageMin: string
  ageMax: string
  serviceYearsMin: string
  hasResearch: boolean | undefined
}

const BLANK: PersonnelSearchFilterValues = {
  keyword: '',
  category: '',
  status: '',
  rank: '',
  position: '',
  degree: '',
  academicTitle: '',
  major: '',
  politicalTheory: '',
  unitId: '',
  ageMin: '',
  ageMax: '',
  serviceYearsMin: '',
  hasResearch: undefined,
}

interface PersonnelSearchFilterProps {
  onSearch: (values: PersonnelSearchFilterValues) => void
  loading?: boolean
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Cán bộ chỉ huy',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  CONG_NHAN_VIEN: 'CNVCQP',
  HOC_VIEN_QUAN_SU: 'Học viên quân sự',
  SINH_VIEN_DAN_SU: 'Sinh viên dân sự',
}

const STATUS_LABELS: Record<string, string> = {
  DANG_CONG_TAC: 'Đang công tác',
  NGHI_HUU: 'Nghỉ hưu',
  CHUYEN_CONG_TAC: 'Chuyển công tác',
  DI_HOC: 'Đi học',
  TAM_NGHI: 'Tạm nghỉ',
  XUAT_NGU: 'Xuất ngũ',
  TU_TRAN: 'Từ trần',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonnelSearchFilter({ onSearch, loading = false }: PersonnelSearchFilterProps) {
  const [filters, setFilters] = useState<PersonnelSearchFilterValues>(BLANK)
  const [expanded, setExpanded] = useState(false)

  const set = (field: keyof PersonnelSearchFilterValues, value: string | boolean | undefined) =>
    setFilters((prev) => ({ ...prev, [field]: value }))

  function handleReset() {
    setFilters(BLANK)
    onSearch(BLANK)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(filters)
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Always-visible row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Tìm theo họ tên, mã cán bộ, số quân..."
                value={filters.keyword}
                onChange={(e) => set('keyword', e.target.value)}
              />
            </div>
            <Select value={filters.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Loại cán bộ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tất cả loại</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tất cả</SelectItem>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading}>
              <Search className="w-4 h-4 mr-1" />
              Tìm
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground text-xs"
            >
              {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {expanded ? 'Thu gọn' : 'Bộ lọc nâng cao'}
            </Button>
          </div>

          {/* Expanded advanced filters */}
          {expanded && (
            <div className="pt-2 border-t grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quân hàm</Label>
                <Input
                  placeholder="VD: Đại tá, Thượng tá..."
                  value={filters.rank}
                  onChange={(e) => set('rank', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chức vụ</Label>
                <Input
                  placeholder="Chứa từ khóa chức vụ"
                  value={filters.position}
                  onChange={(e) => set('position', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Học vị</Label>
                <Input
                  placeholder="VD: Tiến sĩ, Thạc sĩ..."
                  value={filters.degree}
                  onChange={(e) => set('degree', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Học hàm</Label>
                <Input
                  placeholder="VD: GS, PGS..."
                  value={filters.academicTitle}
                  onChange={(e) => set('academicTitle', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chuyên ngành</Label>
                <Input
                  value={filters.major}
                  onChange={(e) => set('major', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lý luận chính trị</Label>
                <Input
                  placeholder="VD: Cao cấp, Trung cấp..."
                  value={filters.politicalTheory}
                  onChange={(e) => set('politicalTheory', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tuổi từ</Label>
                <Input
                  type="number"
                  min={18}
                  max={70}
                  placeholder="18"
                  value={filters.ageMin}
                  onChange={(e) => set('ageMin', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tuổi đến</Label>
                <Input
                  type="number"
                  min={18}
                  max={70}
                  placeholder="60"
                  value={filters.ageMax}
                  onChange={(e) => set('ageMax', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Năm công tác tối thiểu</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={filters.serviceYearsMin}
                  onChange={(e) => set('serviceYearsMin', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-4 col-span-3">
                <Checkbox
                  id="hasResearch"
                  checked={filters.hasResearch === true}
                  onCheckedChange={(v) => set('hasResearch', v ? true : undefined)}
                />
                <Label htmlFor="hasResearch" className="text-sm cursor-pointer">
                  Chỉ hiển thị cán bộ có hồ sơ nghiên cứu khoa học
                </Label>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
