/**
 * M03 — Shared label/color maps for Party enum values.
 *
 * Nguồn sự thật: Prisma schema enum definitions.
 * Tương lai: các map này sẽ được thay bằng useMasterData() từ M19 khi sẵn sàng.
 */

import type {
  PartyMemberStatus,
  ReviewGrade,
  DisciplineSeverity,
  MeetingType,
  PartyHistoryType,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// PartyMemberStatus
// ---------------------------------------------------------------------------

export const PARTY_STATUS_LABELS: Record<PartyMemberStatus, string> = {
  QUAN_CHUNG: 'Quần chúng',
  CAM_TINH: 'Cảm tình',
  DOI_TUONG: 'Đối tượng',
  DU_BI: 'Dự bị',
  CHINH_THUC: 'Chính thức',
  CHUYEN_DI: 'Chuyển đi',
  XOA_TEN_TU_NGUYEN: 'Xóa tên tự nguyện',
  KHAI_TRU: 'Khai trừ',
  // Trạng thái dạng English có trong enum PartyMemberStatus (giữ đồng bộ với map cục bộ ở party/members)
  ACTIVE: 'Hoạt động',
  TRANSFERRED: 'Đã chuyển',
  SUSPENDED: 'Đình chỉ',
  EXPELLED: 'Khai trừ',
};

export const PARTY_STATUS_COLORS: Record<PartyMemberStatus, string> = {
  CHINH_THUC: '#22c55e',
  DU_BI: '#3b82f6',
  DOI_TUONG: '#f59e0b',
  CAM_TINH: '#eab308',
  QUAN_CHUNG: '#9ca3af',
  CHUYEN_DI: '#f97316',
  XOA_TEN_TU_NGUYEN: '#ef4444',
  KHAI_TRU: '#7f1d1d',
  ACTIVE: '#22c55e',
  TRANSFERRED: '#06b6d4',
  SUSPENDED: '#f59e0b',
  EXPELLED: '#7f1d1d',
};

// ---------------------------------------------------------------------------
// PartyMember lifecycle transitions
//
// Đây là source of truth dùng chung cho:
// - backend: party-lifecycle.service.assertPartyLifecycleTransition (enforce)
// - frontend: dialog chỉnh sửa hồ sơ chỉ gợi ý các trạng thái đích hợp lệ.
//
// UI chỉ dùng để gợi ý; backend vẫn enforce nên không phải duplicate rule.
// ---------------------------------------------------------------------------

export const PARTY_LIFECYCLE_TRANSITIONS: Record<PartyMemberStatus, PartyMemberStatus[]> = {
  QUAN_CHUNG: ['CAM_TINH'],
  CAM_TINH: ['DOI_TUONG'],
  DOI_TUONG: ['DU_BI'],
  DU_BI: ['CHINH_THUC', 'XOA_TEN_TU_NGUYEN', 'KHAI_TRU'],
  CHINH_THUC: ['CHUYEN_DI', 'XOA_TEN_TU_NGUYEN', 'KHAI_TRU'],
  CHUYEN_DI: ['CHINH_THUC'],
  XOA_TEN_TU_NGUYEN: [],
  KHAI_TRU: [],
  // Legacy statuses (tương thích dữ liệu cũ): không cho chuyển trong vòng đời mới.
  ACTIVE: [],
  TRANSFERRED: [],
  SUSPENDED: [],
  EXPELLED: [],
};

/**
 * Danh sách trạng thái chọn được khi chỉnh sửa: trạng thái hiện tại (giữ nguyên)
 * cộng các trạng thái đích hợp lệ. Trả về unique, giữ thứ tự current trước.
 */
export function getEditablePartyStatusOptions(current: PartyMemberStatus): PartyMemberStatus[] {
  const next = PARTY_LIFECYCLE_TRANSITIONS[current] ?? [];
  return Array.from(new Set<PartyMemberStatus>([current, ...next]));
}

// ---------------------------------------------------------------------------
// ReviewGrade  (enum: HTXSNV | HTTNV | HTNV | KHNV)
// ---------------------------------------------------------------------------

export interface ReviewGradeMeta {
  key: ReviewGrade;
  label: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
}

export const REVIEW_GRADES: ReviewGradeMeta[] = [
  {
    key: 'HTXSNV',
    label: 'Hoàn thành xuất sắc nhiệm vụ',
    short: 'HTXS',
    color: '#10B981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    key: 'HTTNV',
    label: 'Hoàn thành tốt nhiệm vụ',
    short: 'HTT',
    color: '#3B82F6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    key: 'HTNV',
    label: 'Hoàn thành nhiệm vụ',
    short: 'HT',
    color: '#6B7280',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  {
    key: 'KHNV',
    label: 'Không hoàn thành nhiệm vụ',
    short: 'KHT',
    color: '#EF4444',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
];

export const REVIEW_GRADE_MAP = Object.fromEntries(
  REVIEW_GRADES.map((g) => [g.key, g]),
) as Record<ReviewGrade, ReviewGradeMeta>;

export const REVIEW_GRADE_LABELS: Record<ReviewGrade, string> = {
  HTXSNV: 'Hoàn thành xuất sắc nhiệm vụ',
  HTTNV: 'Hoàn thành tốt nhiệm vụ',
  HTNV: 'Hoàn thành nhiệm vụ',
  KHNV: 'Không hoàn thành nhiệm vụ',
};

export const REVIEW_GRADE_COLORS: Record<ReviewGrade, string> = {
  HTXSNV: '#10B981',
  HTTNV: '#3B82F6',
  HTNV: '#6B7280',
  KHNV: '#EF4444',
};

// ---------------------------------------------------------------------------
// DisciplineSeverity  (enum: KHIEN_TRACH | CANH_CAO | CACH_CHUC | KHAI_TRU_KHOI_DANG)
// ---------------------------------------------------------------------------

export const DISCIPLINE_SEVERITY_LABELS: Record<DisciplineSeverity, string> = {
  KHIEN_TRACH: 'Khiển trách',
  CANH_CAO: 'Cảnh cáo',
  CACH_CHUC: 'Cách chức',
  KHAI_TRU_KHOI_DANG: 'Khai trừ khỏi Đảng',
};

export const DISCIPLINE_SEVERITY_COLORS: Record<DisciplineSeverity, string> = {
  KHIEN_TRACH: '#f59e0b',
  CANH_CAO: '#f97316',
  CACH_CHUC: '#ef4444',
  KHAI_TRU_KHOI_DANG: '#7f1d1d',
};

// ---------------------------------------------------------------------------
// MeetingType  (enum: THUONG_KY | BAT_THUONG | MO_RONG | CHUYEN_DE | KIEM_DIEM_CUOI_NAM | BAU_CU)
// ---------------------------------------------------------------------------

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  THUONG_KY: 'Thường kỳ',
  BAT_THUONG: 'Bất thường',
  MO_RONG: 'Mở rộng',
  CHUYEN_DE: 'Chuyên đề',
  KIEM_DIEM_CUOI_NAM: 'Kiểm điểm cuối năm',
  BAU_CU: 'Bầu cử',
};

// ---------------------------------------------------------------------------
// PartyHistoryType  (enum — history event labels)
// ---------------------------------------------------------------------------

export const PARTY_HISTORY_TYPE_LABELS: Record<PartyHistoryType, string> = {
  ADMITTED: 'Kết nạp chính thức',
  OFFICIAL_CONFIRMED: 'Xác nhận đảng viên chính thức',
  TRANSFER_IN: 'Chuyển đến',
  TRANSFER_OUT: 'Chuyển đi',
  APPOINTED: 'Bổ nhiệm chức vụ',
  REMOVED_POSITION: 'Miễn chức vụ',
  STATUS_CHANGED: 'Thay đổi trạng thái',
  SUSPENDED: 'Đình chỉ',
  EXPELLED: 'Khai trừ',
  RESTORED: 'Phục hồi',
  OTHER: 'Khác',
};

export const PARTY_HISTORY_TYPE_COLORS: Record<PartyHistoryType, string> = {
  ADMITTED: 'bg-green-100 text-green-800',
  OFFICIAL_CONFIRMED: 'bg-blue-100 text-blue-800',
  TRANSFER_IN: 'bg-cyan-100 text-cyan-800',
  TRANSFER_OUT: 'bg-orange-100 text-orange-800',
  APPOINTED: 'bg-purple-100 text-purple-800',
  REMOVED_POSITION: 'bg-slate-100 text-slate-700',
  STATUS_CHANGED: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  EXPELLED: 'bg-red-100 text-red-800',
  RESTORED: 'bg-emerald-100 text-emerald-800',
  OTHER: 'bg-gray-100 text-gray-600',
};
