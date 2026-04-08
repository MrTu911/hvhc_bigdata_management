'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonnelSearchItem {
  id: string
  personnelCode: string
  fullName: string
  dateOfBirth: string | null
  gender: string | null
  category: string | null
  status: string
  militaryRank: string | null
  position: string | null
  academicTitle: string | null
  academicDegree: string | null
  educationLevel: string | null
  specialization: string | null
  politicalTheory: string | null
  enlistmentDate: string | null
  unit: { id: string; name: string; code: string } | null
  scientificProfile: { id: string } | null
}

interface PersonnelSearchResultTableProps {
  items: PersonnelSearchItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Chỉ huy',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'NCV',
  CONG_NHAN_VIEN: 'CNVCQP',
  HOC_VIEN_QUAN_SU: 'HV QS',
  SINH_VIEN_DAN_SU: 'SV DS',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DANG_CONG_TAC: 'default',
  NGHI_HUU: 'secondary',
  CHUYEN_CONG_TAC: 'outline',
  DI_HOC: 'secondary',
  TAM_NGHI: 'outline',
  XUAT_NGU: 'outline',
  TU_TRAN: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  DANG_CONG_TAC: 'Đang CT',
  NGHI_HUU: 'Nghỉ hưu',
  CHUYEN_CONG_TAC: 'Chuyển',
  DI_HOC: 'Đi học',
  TAM_NGHI: 'Tạm nghỉ',
  XUAT_NGU: 'Xuất ngũ',
  TU_TRAN: 'Từ trần',
}

function age(dob: string | null): string {
  if (!dob) return '—'
  return String(new Date().getFullYear() - new Date(dob).getFullYear())
}

function serviceYears(enlistment: string | null): string {
  if (!enlistment) return '—'
  return String(new Date().getFullYear() - new Date(enlistment).getFullYear())
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonnelSearchResultTable({
  items,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  loading = false,
}: PersonnelSearchResultTableProps) {
  if (!loading && items.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center text-muted-foreground text-sm">
        Không tìm thấy kết quả phù hợp.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground px-1">
        {loading ? 'Đang tìm kiếm…' : `${total} kết quả`}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Mã CB</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Quân hàm / Chức vụ</TableHead>
              <TableHead>Học vị / CN</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead className="text-center">Tuổi</TableHead>
              <TableHead className="text-center">Năm CT</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{p.fullName}</div>
                      {p.scientificProfile && (
                        <div className="flex items-center gap-1 text-xs text-teal-600 mt-0.5">
                          <FlaskConical className="w-3 h-3" />
                          NCKH
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.personnelCode}
                    </TableCell>
                    <TableCell>
                      {p.category && (
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[p.category] ?? p.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.militaryRank && <div>{p.militaryRank}</div>}
                      {p.position && (
                        <div className="text-xs text-muted-foreground">{p.position}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.academicDegree && <div>{p.academicDegree}</div>}
                      {p.academicTitle && (
                        <div className="text-xs text-muted-foreground">{p.academicTitle}</div>
                      )}
                      {!p.academicDegree && !p.academicTitle && p.specialization && (
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {p.specialization}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.unit?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">{age(p.dateOfBirth)}</TableCell>
                    <TableCell className="text-center text-sm">
                      {serviceYears(p.enlistmentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] ?? 'outline'} className="text-xs">
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/dashboard/personnel/${p.id}`}>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
