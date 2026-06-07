/**
 * Rank Declaration – nhãn & cấu hình hiển thị dùng chung cho UI (M02 extension)
 *
 * Gom nhãn trạng thái, loại sự kiện và nhãn quân hàm về một chỗ để 3 trang
 * (list / create / detail) không lặp lại mapping. Nhãn quân hàm tái dùng từ
 * lib/promotion/promotionUtils để tránh hai nguồn sự thật.
 */
import {
  OFFICER_RANK_LABELS,
  SOLDIER_RANK_LABELS,
  OFFICER_RANK_ORDER,
  SOLDIER_RANK_ORDER,
} from '@/lib/promotion/promotionUtils'

// ─── Trạng thái bản khai ────────────────────────────────────────────────────

export interface DeclarationStatusMeta {
  label: string
  /** class cho pill trạng thái: nền nhạt + chữ đậm + viền cùng tông */
  pill: string
  /** chấm tròn nhỏ đứng trước nhãn (dùng ở chỗ cần gọn) */
  dot: string
}

export const DECLARATION_STATUS_META: Record<string, DeclarationStatusMeta> = {
  DRAFT:          { label: 'Bản nháp',     pill: 'bg-slate-100 text-slate-600 border-slate-200',   dot: 'bg-slate-400' },
  PENDING_REVIEW: { label: 'Chờ duyệt',    pill: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  UNDER_REVIEW:   { label: 'Đang xét',     pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  APPROVED:       { label: 'Đã phê duyệt', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED:       { label: 'Từ chối',      pill: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500' },
  RETURNED:       { label: 'Trả lại',      pill: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  CANCELLED:      { label: 'Đã hủy',       pill: 'bg-slate-100 text-slate-400 border-slate-200',   dot: 'bg-slate-300' },
}

export function getDeclarationStatusMeta(status: string): DeclarationStatusMeta {
  return (
    DECLARATION_STATUS_META[status] ?? {
      label: status,
      pill: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    }
  )
}

/** Thứ tự trạng thái muốn show làm KPI trên hero/summary */
export const DECLARATION_STATUS_ORDER = [
  'DRAFT',
  'PENDING_REVIEW',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RETURNED',
  'CANCELLED',
] as const

// ─── Loại sự kiện thăng/biến động quân hàm ──────────────────────────────────

export const PROMOTION_TYPE_LABELS: Record<string, string> = {
  THANG_CAP:   'Thăng cấp',
  BO_NHIEM:    'Bổ nhiệm',
  DIEU_DONG:   'Điều động',
  LUAN_CHUYEN: 'Luân chuyển',
  GIANG_CHUC:  'Giáng chức',
  CACH_CHUC:   'Cách chức',
  NGHI_HUU:    'Nghỉ hưu',
  XUAT_NGU:    'Xuất ngũ',
}

export const PROMOTION_TYPE_OPTIONS = Object.entries(PROMOTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function getPromotionTypeLabel(type: string): string {
  return PROMOTION_TYPE_LABELS[type] ?? type
}

// ─── Quân hàm ───────────────────────────────────────────────────────────────

export type RankType = 'OFFICER' | 'SOLDIER'

export const RANK_TYPE_LABELS: Record<string, string> = {
  OFFICER: 'Sĩ quan',
  SOLDIER: 'Quân nhân',
}

/** Đổi mã quân hàm (THIEU_UY...) thành nhãn tiếng Việt; trả '—' nếu rỗng. */
export function getRankLabel(code: string | null | undefined): string {
  if (!code) return '—'
  return (
    (OFFICER_RANK_LABELS as Record<string, string>)[code] ??
    (SOLDIER_RANK_LABELS as Record<string, string>)[code] ??
    code
  )
}

/** Danh sách lựa chọn quân hàm theo loại, thứ tự từ thấp → cao cho form. */
export function getRankOptions(rankType: RankType): { value: string; label: string }[] {
  if (rankType === 'SOLDIER') {
    return [...SOLDIER_RANK_ORDER]
      .reverse()
      .map((value) => ({ value, label: SOLDIER_RANK_LABELS[value] }))
  }
  return [...OFFICER_RANK_ORDER]
    .reverse()
    .map((value) => ({ value, label: OFFICER_RANK_LABELS[value] }))
}

// ─── Trạng thái đề nghị chỉnh sửa ───────────────────────────────────────────

export const AMENDMENT_STATUS_META: Record<string, { label: string; pill: string }> = {
  DRAFT:     { label: 'Nháp',     pill: 'bg-slate-100 text-slate-600 border-slate-200' },
  SUBMITTED: { label: 'Chờ duyệt', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPROVED:  { label: 'Đã duyệt', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { label: 'Từ chối',  pill: 'bg-red-50 text-red-700 border-red-200' },
}

export function getAmendmentStatusMeta(status: string) {
  return (
    AMENDMENT_STATUS_META[status] ?? {
      label: status,
      pill: 'bg-slate-100 text-slate-600 border-slate-200',
    }
  )
}
