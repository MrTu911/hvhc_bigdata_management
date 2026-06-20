/**
 * Hằng số dùng chung cho "Hồ sơ cán bộ điện tử" (mẫu 99 trường) — M02 ext.
 *
 * Tập trung nhãn enum tiếng Việt + tùy chọn select để cả resolver xuất văn bản
 * (cadre-profile-export.service.ts) và UI nhập liệu cùng dùng một nguồn, tránh lệch.
 */

export const MARITAL_STATUS_LABELS: Record<string, string> = {
  DOC_THAN: 'Độc thân',
  KET_HON: 'Kết hôn',
  LY_HON: 'Ly hôn',
  GOA: 'Góa',
};

export const COMMAND_MGMT_LEVEL_LABELS: Record<string, string> = {
  SO_CAP: 'Sơ cấp',
  TRUNG_CAP: 'Trung cấp',
  CAO_CAP: 'Cao cấp',
};

export const POLITICAL_THEORY_LEVEL_LABELS: Record<string, string> = {
  SO_CAP: 'Sơ cấp',
  TRUNG_CAP: 'Trung cấp',
  CAO_CAP: 'Cao cấp',
  CU_NHAN: 'Cử nhân',
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  DAT: 'Đất ở',
  NHA: 'Nhà ở',
  O_TO: 'Ô tô',
  TAI_SAN_KHAC: 'Tài sản khác',
};

export const EVALUATION_PERIOD_TYPE_LABELS: Record<string, string> = {
  QUY: 'Quý',
  NAM: 'Năm',
};

export const MANAGEMENT_CATEGORY_LABELS: Record<string, string> = {
  CAN_BO: 'Cán bộ',
  QUAN_LUC: 'Quân lực',
};

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  DAI_HOC: 'Đại học',
  THAC_SI: 'Thạc sĩ',
  TIEN_SI: 'Tiến sĩ',
  CU_NHAN_NGOAI_NGU: 'Cử nhân ngoại ngữ',
  KHAC: 'Khác',
};

export const RESEARCH_ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm',
  THAM_GIA: 'Tham gia',
  THANH_VIEN: 'Thành viên',
};

export const PUBLICATION_TYPE_LABELS: Record<string, string> = {
  GIAO_TRINH: 'Giáo trình',
  TAI_LIEU: 'Tài liệu',
  BAI_TAP: 'Bài tập',
  BAI_BAO: 'Bài báo',
  SANG_KIEN: 'Sáng kiến',
  DE_TAI: 'Đề tài',
  GIAO_TRINH_DT: 'Giáo trình điện tử',
};

export const PUBLICATION_ROLE_LABELS: Record<string, string> = {
  CHU_BIEN: 'Chủ biên',
  THAM_GIA: 'Tham gia',
  DONG_TAC_GIA: 'Đồng tác giả',
};

export const FAMILY_RELATION_LABELS: Record<string, string> = {
  FATHER: 'Bố đẻ',
  MOTHER: 'Mẹ đẻ',
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  SIBLING: 'Anh/Chị/Em ruột',
  FATHER_IN_LAW: 'Bố vợ/chồng',
  MOTHER_IN_LAW: 'Mẹ vợ/chồng',
  OTHER: 'Khác',
};

export const PARTY_POSITION_LABELS: Record<string, string> = {
  BI_THU: 'Bí thư',
  PHO_BI_THU: 'Phó Bí thư',
  CAP_UY_VIEN: 'Cấp ủy viên',
  DANG_VIEN: 'Đảng viên',
  BI_THU_CHI_BO: 'Bí thư chi bộ',
  PHO_BI_THU_CHI_BO: 'Phó Bí thư chi bộ',
  TO_TRUONG_TO_DANG: 'Tổ trưởng tổ Đảng',
  TO_PHO_TO_DANG: 'Tổ phó tổ Đảng',
};

export const POLICY_LEVEL_LABELS: Record<string, string> = {
  STATE: 'Nhà nước',
  GOVERNMENT: 'Chính phủ',
  NATIONAL: 'Toàn quốc',
  MINISTRY: 'Bộ Quốc phòng',
  ACADEMY: 'Học viện',
  UNIT: 'Đơn vị',
  DEPARTMENT: 'Phòng/Ban',
};

/** Nhãn đầy đủ cho enum CareerEventType (17 giá trị) — dùng cho section "Quá trình công tác". */
export const CAREER_EVENT_TYPE_LABELS: Record<string, string> = {
  ENLISTMENT: 'Nhập ngũ / Tuyển dụng',
  PROMOTION: 'Thăng quân hàm',
  APPOINTMENT: 'Bổ nhiệm chức vụ',
  POSITION_CHANGE: 'Thay đổi chức vụ',
  TRANSFER: 'Điều động',
  UNIT_CHANGE: 'Chuyển đơn vị',
  SECONDMENT: 'Biệt phái',
  TRAINING: 'Đào tạo / Bồi dưỡng',
  STUDY_LEAVE: 'Đi học tập trung',
  RETURN: 'Trở lại công tác',
  AWARD: 'Khen thưởng',
  DISCIPLINE: 'Kỷ luật',
  RANK_DEMOTION: 'Giáng cấp',
  RETIREMENT_PREP: 'Chuẩn bị nghỉ hưu',
  RETIREMENT: 'Nghỉ hưu',
  DISCHARGE: 'Phục viên / Xuất ngũ',
  OTHER: 'Khác',
};

/** Tùy chọn select cho UI nhập liệu (label + value). */
export function toSelectOptions(labels: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
