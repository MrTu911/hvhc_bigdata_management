/**
 * Registry các "nhóm" dữ liệu hồ sơ cán bộ điện tử (mẫu 99 trường) — M02 ext.
 *
 * Dùng CHUNG cho:
 *   - Backend: generic CRUD service + validate (cadre-profile-section.service.ts).
 *   - Frontend: render form/section động (components/personnel/profile/cadre/*).
 *
 * KHÔNG import server-only ở đây (client cũng import). Tên `model` là Prisma delegate.
 */

import {
  ASSET_TYPE_LABELS,
  COMMAND_MGMT_LEVEL_LABELS,
  EVALUATION_PERIOD_TYPE_LABELS,
  MANAGEMENT_CATEGORY_LABELS,
  MARITAL_STATUS_LABELS,
  POLITICAL_THEORY_LEVEL_LABELS,
  toSelectOptions,
} from './cadre-profile';

export type CadreFieldType = 'text' | 'textarea' | 'date' | 'number' | 'decimal' | 'boolean' | 'select';

export interface CadreField {
  name: string;
  label: string;
  type: CadreFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Trường nhạy cảm: chỉ ghi/đọc khi có PERSONNEL.VIEW_SENSITIVE. */
  sensitive?: boolean;
}

export interface CadreListSection {
  /** Slug trên URL: /api/personnel/[id]/profile/[slug]. */
  slug: string;
  /** Prisma delegate name. */
  model: string;
  title: string;
  /** Trường liệt kê trên bảng (subset của fields). */
  listColumns: string[];
  fields: CadreField[];
  orderBy: { field: string; dir: 'asc' | 'desc' };
  /** Xử lý đặc biệt: lịch sử chức vụ Đoàn cần membershipId. */
  special?: 'youthHistory';
}

const DATE = 'date' as const;
const TEXT = 'text' as const;

/** 11 nhóm dạng danh sách (mỗi nhóm = 1 model con). */
export const CADRE_LIST_SECTIONS: CadreListSection[] = [
  {
    slug: 'concurrent-positions',
    model: 'concurrentPosition',
    title: 'Chức vụ kiêm nhiệm',
    listColumns: ['positionTitle', 'fromDate', 'unit'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    fields: [
      { name: 'positionTitle', label: 'Chức vụ kiêm', type: TEXT, required: true },
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'unit', label: 'Đơn vị', type: TEXT },
      { name: 'detail', label: 'Chi tiết', type: 'textarea' },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
    ],
  },
  {
    slug: 'combat',
    model: 'combatHistory',
    title: 'Quá trình chiến đấu',
    listColumns: ['battlefield', 'fromDate', 'role'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    fields: [
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'battlefield', label: 'Chiến trường / mặt trận', type: TEXT },
      { name: 'unit', label: 'Đơn vị chiến đấu', type: TEXT },
      { name: 'role', label: 'Cương vị', type: TEXT },
      { name: 'description', label: 'Mô tả', type: 'textarea' },
    ],
  },
  {
    slug: 'ethnic-languages',
    model: 'ethnicLanguage',
    title: 'Tiếng dân tộc',
    listColumns: ['language', 'proficiency'],
    orderBy: { field: 'sortOrder', dir: 'asc' },
    fields: [
      { name: 'language', label: 'Tiếng dân tộc', type: TEXT, required: true },
      { name: 'proficiency', label: 'Mức độ', type: TEXT },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
  },
  {
    slug: 'assets',
    model: 'assetDeclaration',
    title: 'Tài sản (kê khai)',
    listColumns: ['assetType', 'assetName', 'declaredDate'],
    orderBy: { field: 'sortOrder', dir: 'asc' },
    fields: [
      { name: 'assetType', label: 'Loại tài sản', type: 'select', required: true, options: toSelectOptions(ASSET_TYPE_LABELS) },
      { name: 'assetName', label: 'Tên tài sản', type: TEXT, required: true },
      { name: 'declaredDate', label: 'Ngày xác lập', type: DATE },
      { name: 'area', label: 'Diện tích', type: TEXT },
      { name: 'value', label: 'Giá trị', type: 'decimal', sensitive: true },
      { name: 'documentRef', label: 'Giấy tờ', type: TEXT, sensitive: true },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
  },
  {
    slug: 'foreign-trips',
    model: 'foreignTrip',
    title: 'Đi nước ngoài',
    listColumns: ['country', 'fromDate', 'purpose'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    fields: [
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'country', label: 'Nước đến', type: TEXT, required: true },
      { name: 'purpose', label: 'Mục đích', type: 'textarea' },
      { name: 'sponsor', label: 'Kinh phí / nguồn cử đi', type: TEXT },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
    ],
  },
  {
    slug: 'honors',
    model: 'honorTitleRecord',
    title: 'Danh hiệu',
    listColumns: ['titleName', 'awardYear', 'level'],
    orderBy: { field: 'awardYear', dir: 'asc' },
    fields: [
      { name: 'titleName', label: 'Danh hiệu', type: TEXT, required: true },
      { name: 'level', label: 'Cấp', type: TEXT },
      { name: 'awardYear', label: 'Năm', type: 'number' },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
      { name: 'awardedBy', label: 'Cấp tặng', type: TEXT },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
  },
  {
    slug: 'evaluations',
    model: 'personnelEvaluation',
    title: 'Xếp loại đánh giá (quý/năm)',
    listColumns: ['periodType', 'periodYear', 'taskResultLabel'],
    orderBy: { field: 'periodYear', dir: 'asc' },
    fields: [
      { name: 'periodType', label: 'Kỳ', type: 'select', required: true, options: toSelectOptions(EVALUATION_PERIOD_TYPE_LABELS) },
      { name: 'periodYear', label: 'Năm', type: 'number', required: true },
      { name: 'periodQuarter', label: 'Quý (1-4)', type: 'number' },
      { name: 'taskResultLabel', label: 'Kết quả phân loại', type: TEXT },
      { name: 'partyMemberRank', label: 'Xếp loại đảng viên', type: TEXT },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
  },
  {
    slug: 'allowances',
    model: 'allowanceRecord',
    title: 'Phụ cấp',
    listColumns: ['allowanceLabel', 'coefficient', 'fromDate'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    fields: [
      { name: 'allowanceLabel', label: 'Loại phụ cấp', type: TEXT },
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'coefficient', label: 'Hệ số', type: 'decimal' },
      { name: 'reason', label: 'Lý do', type: TEXT },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
    ],
  },
  {
    slug: 'professional-titles',
    model: 'professionalTitleRecord',
    title: 'Chức danh CMKTNV',
    listColumns: ['titleName', 'effectiveDate'],
    orderBy: { field: 'effectiveDate', dir: 'asc' },
    fields: [
      { name: 'titleName', label: 'Chức danh CMKTNV', type: TEXT, required: true },
      { name: 'effectiveDate', label: 'Thời gian nhận', type: DATE },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
      { name: 'issuer', label: 'Cấp công nhận', type: TEXT },
      { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    ],
  },
  {
    slug: 'external-positions',
    model: 'externalPosition',
    title: 'Chức vụ ngoài Quân đội',
    listColumns: ['positionTitle', 'organization', 'fromDate'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    fields: [
      { name: 'positionTitle', label: 'Chức vụ', type: TEXT, required: true },
      { name: 'organization', label: 'Tổ chức', type: TEXT },
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
    ],
  },
  {
    slug: 'doan-positions',
    model: 'youthUnionPositionHistory',
    title: 'Chức vụ Đoàn',
    listColumns: ['position', 'organization', 'fromDate'],
    orderBy: { field: 'fromDate', dir: 'asc' },
    special: 'youthHistory',
    fields: [
      { name: 'position', label: 'Chức vụ Đoàn', type: TEXT, required: true },
      { name: 'organization', label: 'Tổ chức', type: TEXT },
      { name: 'fromDate', label: 'Từ ngày', type: DATE },
      { name: 'toDate', label: 'Đến ngày', type: DATE },
      { name: 'decisionNumber', label: 'Số quyết định', type: TEXT },
    ],
  },
];

export function getCadreSection(slug: string): CadreListSection | undefined {
  return CADRE_LIST_SECTIONS.find((s) => s.slug === slug);
}

// ===== Trường scalar (User) cho form "Thông tin mở rộng" =====

export interface ExtendedFieldGroup {
  title: string;
  fields: CadreField[];
}

export const EXTENDED_FIELD_GROUPS: ExtendedFieldGroup[] = [
  {
    title: 'Định danh bổ sung',
    fields: [
      { name: 'aliasName', label: 'Họ tên khác / bí danh', type: TEXT },
      { name: 'managementCategory', label: 'Đối tượng quản lý', type: 'select', options: toSelectOptions(MANAGEMENT_CATEGORY_LABELS) },
      { name: 'maritalStatus', label: 'Tình trạng hôn nhân', type: 'select', options: toSelectOptions(MARITAL_STATUS_LABELS) },
      { name: 'identifyingMarks', label: 'Nhận dạng', type: TEXT },
    ],
  },
  {
    title: 'Tiền lương',
    fields: [
      { name: 'salaryRaiseCount', label: 'Nâng lương (lần)', type: 'number', sensitive: true },
      { name: 'salaryRaiseDate', label: 'Thời gian nâng lương', type: DATE, sensitive: true },
      { name: 'salaryCoefficient', label: 'Hệ số lương', type: 'decimal', sensitive: true },
      { name: 'salaryAmount', label: 'Mức lương', type: 'decimal', sensitive: true },
      { name: 'positionAllowanceCoeff', label: 'Hệ số phụ cấp chức vụ', type: 'decimal', sensitive: true },
    ],
  },
  {
    title: 'Sức khỏe',
    fields: [
      { name: 'healthGrade', label: 'Sức khỏe (loại)', type: TEXT },
      { name: 'height', label: 'Chiều cao (m)', type: 'number' },
      { name: 'weight', label: 'Cân nặng (kg)', type: 'number' },
      { name: 'chronicDisease', label: 'Bệnh chính', type: TEXT },
      { name: 'disabilityStatus', label: 'Thương tật', type: TEXT },
      { name: 'disabilityDetail', label: 'Chi tiết thương tật', type: 'textarea' },
      { name: 'warMartyrFamily', label: 'Gia đình thương binh, liệt sĩ', type: TEXT },
    ],
  },
  {
    title: 'Trình độ',
    fields: [
      { name: 'academicTitleDate', label: 'Thời gian học hàm', type: DATE },
      { name: 'commandMgmtLevel', label: 'Trình độ CHQL', type: 'select', options: toSelectOptions(COMMAND_MGMT_LEVEL_LABELS) },
      { name: 'commandMgmtLevelDate', label: 'Thời gian nhận CHQL', type: DATE },
      { name: 'politicalTheoryLevel', label: 'Trình độ LLCT', type: 'select', options: toSelectOptions(POLITICAL_THEORY_LEVEL_LABELS) },
      { name: 'politicalTheoryDate', label: 'Thời gian LLCT', type: DATE },
      { name: 'generalEducationLevel', label: 'Trình độ văn hóa', type: TEXT },
    ],
  },
  {
    title: 'Quá trình phục vụ',
    fields: [
      { name: 'revolutionJoinDate', label: 'Tham gia cách mạng', type: DATE },
      { name: 'recruitmentDate', label: 'Thời gian tuyển dụng', type: DATE },
      { name: 'recruitmentUnit', label: 'Đơn vị tuyển dụng', type: TEXT },
      { name: 'enlistmentUnit', label: 'Đơn vị nhập ngũ', type: TEXT },
      { name: 'dischargeUnit', label: 'Đơn vị xuất ngũ', type: TEXT },
      { name: 'reenlistmentDate', label: 'Thời gian tái ngũ', type: DATE },
      { name: 'reenlistmentUnit', label: 'Đơn vị tái ngũ', type: TEXT },
    ],
  },
  {
    title: 'Đảng - Đoàn',
    fields: [
      { name: 'partyJoinPlace', label: 'Nơi kết nạp Đảng', type: TEXT },
      { name: 'partyOfficialPlace', label: 'Nơi vào Đảng chính thức', type: TEXT },
      { name: 'recommenderPartyPosition', label: 'Chức vụ đảng người giới thiệu', type: TEXT },
      // Đoàn (membership, 1:1 — upsert theo userId)
      { name: 'youthJoinDate', label: 'Thời gian vào Đoàn', type: DATE },
      { name: 'youthJoinPlace', label: 'Nơi vào Đoàn', type: TEXT },
      { name: 'youthCurrentPosition', label: 'Chức vụ Đoàn hiện tại', type: TEXT },
    ],
  },
  {
    title: 'Sở trường - Công tác',
    fields: [
      { name: 'workStrength', label: 'Sở trường công tác', type: 'textarea' },
      { name: 'personalStrength', label: 'Sở trường cá nhân', type: 'textarea' },
      { name: 'personalHobby', label: 'Sở thích cá nhân', type: 'textarea' },
      { name: 'currentMainWork', label: 'Công tác chính đang làm', type: 'textarea' },
      { name: 'longestWork', label: 'Công việc đã làm lâu nhất', type: TEXT },
      { name: 'currentSector', label: 'Ngành đang công tác', type: TEXT },
      { name: 'cadreType', label: 'Loại cán bộ', type: TEXT },
      { name: 'entrySource', label: 'Nguồn vào đội ngũ', type: TEXT },
      { name: 'isCorrectPosition', label: 'Đúng vị trí công tác', type: 'boolean' },
      { name: 'headcountIncreaseReason', label: 'Lý do tăng quân số', type: TEXT },
      { name: 'headcountIncreaseDate', label: 'Thời gian tăng quân số', type: DATE },
    ],
  },
  {
    title: 'Địa chỉ',
    fields: [
      { name: 'permanentAddress', label: 'Thường trú (địa danh mới)', type: 'textarea' },
      { name: 'temporaryAddress', label: 'Nơi ở hiện nay', type: 'textarea' },
      { name: 'birthPlace', label: 'Nơi sinh', type: 'textarea' },
      { name: 'placeOfOrigin', label: 'Quê quán', type: 'textarea' },
    ],
  },
];

/** Field Đoàn (membership) tách riêng khỏi cột User (upsert youthUnionMembership). */
export const YOUTH_MEMBERSHIP_FIELD_MAP: Record<string, string> = {
  youthJoinDate: 'joinDate',
  youthJoinPlace: 'joinPlace',
  youthCurrentPosition: 'currentPosition',
};
