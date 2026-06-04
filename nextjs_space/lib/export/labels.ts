/**
 * Nhãn tiếng Việt cho xuất dữ liệu nhân sự (CSV / Excel / lý lịch 2A).
 *
 * Tập trung mọi map enum → nhãn hiển thị ở một chỗ để biểu mẫu xuất ra
 * thống nhất và đúng nghiệp vụ quân đội. Nhãn cấp quân hàm tái dùng từ
 * lib/promotion/promotionUtils.ts để tránh khai báo trùng.
 */

import {
  OFFICER_RANK_LABELS,
  SOLDIER_RANK_LABELS,
} from '@/lib/promotion/promotionUtils';

/** Trạng thái công tác của nhân sự (Personnel.status). */
export const PERSONNEL_STATUS_LABELS: Record<string, string> = {
  DANG_CONG_TAC: 'Đang công tác',
  NGHI_HUU: 'Nghỉ hưu',
  CHUYEN_CONG_TAC: 'Chuyển công tác',
  DI_HOC: 'Đi học',
  TAM_NGHI: 'Tạm nghỉ',
  XUAT_NGU: 'Xuất ngũ',
  TU_TRAN: 'Từ trần',
};

/** Giới tính. Hỗ trợ cả enum MALE/FEMALE lẫn chuỗi tự do cũ. */
export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  NAM: 'Nam',
  NU: 'Nữ',
  OTHER: 'Khác',
};

/** Quan hệ gia đình (FamilyRelation.relation). */
export const FAMILY_RELATION_LABELS: Record<string, string> = {
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  SIBLING: 'Anh/Chị/Em',
  FATHER_IN_LAW: 'Bố vợ/Bố chồng',
  MOTHER_IN_LAW: 'Mẹ vợ/Mẹ chồng',
  OTHER: 'Khác',
};

/** Trình độ đào tạo (EducationHistory.level). */
export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  DAI_HOC: 'Đại học',
  THAC_SI: 'Thạc sĩ',
  TIEN_SI: 'Tiến sĩ',
  CU_NHAN_NGOAI_NGU: 'Cử nhân ngoại ngữ',
  KHAC: 'Khác',
};

/** Loại bản ghi chính sách (PolicyRecord.recordType). */
export const POLICY_RECORD_TYPE_LABELS: Record<string, string> = {
  EMULATION: 'Thi đua',
  REWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
};

/** Cấp ban hành quyết định chính sách (PolicyRecord.level). */
export const POLICY_LEVEL_LABELS: Record<string, string> = {
  STATE: 'Nhà nước',
  GOVERNMENT: 'Chính phủ',
  NATIONAL: 'Quốc gia',
  MINISTRY: 'Bộ',
  ACADEMY: 'Học viện',
  UNIT: 'Đơn vị',
  DEPARTMENT: 'Phòng/Ban',
};

/**
 * Quy đổi quân hàm (chuỗi enum sĩ quan hoặc QNCN) sang nhãn tiếng Việt.
 * Trả lại nguyên giá trị nếu không khớp enum (vd. dữ liệu nhập tự do cũ).
 */
export function getRankLabel(rank: string | null | undefined): string {
  if (!rank) return '';
  return (
    (OFFICER_RANK_LABELS as Record<string, string>)[rank] ??
    (SOLDIER_RANK_LABELS as Record<string, string>)[rank] ??
    rank
  );
}

/** Tra cứu nhãn theo map; trả nguyên giá trị nếu không khớp, rỗng nếu null. */
export function getLabel(
  map: Record<string, string>,
  value: string | null | undefined
): string {
  if (!value) return '';
  return map[value] ?? value;
}
