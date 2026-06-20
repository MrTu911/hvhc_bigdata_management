/**
 * Hằng số + helper cho luồng "Duyệt cập nhật hồ sơ cán bộ theo phân cấp".
 *
 * Dùng CHUNG client + server (KHÔNG import server-only). Tận dụng metadata field
 * của hồ sơ cán bộ điện tử (cadre-profile-sections) để validate target + xác định
 * trường nhạy cảm cho từng mục thay đổi.
 */
import {
  EXTENDED_FIELD_GROUPS,
  getCadreSection,
  type CadreField,
} from './cadre-profile-sections';

export type ProfileChangeItemTypeValue =
  | 'EXTENDED_FIELD'
  | 'SECTION_CREATE'
  | 'SECTION_UPDATE'
  | 'SECTION_DELETE';

export type ProfileChangeStatusValue =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNIT_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'CANCELLED';

export const PROFILE_CHANGE_STATUS_LABELS: Record<ProfileChangeStatusValue, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Chờ chỉ huy đơn vị duyệt',
  UNIT_APPROVED: 'Chờ Ban cán bộ/Quân lực duyệt',
  APPROVED: 'Đã duyệt & cập nhật CSDL',
  REJECTED: 'Từ chối',
  RETURNED: 'Trả lại bổ sung',
  CANCELLED: 'Đã hủy',
};

export const PROFILE_CHANGE_ITEM_TYPE_LABELS: Record<ProfileChangeItemTypeValue, string> = {
  EXTENDED_FIELD: 'Trường hồ sơ mở rộng',
  SECTION_CREATE: 'Thêm bản ghi danh sách',
  SECTION_UPDATE: 'Sửa bản ghi danh sách',
  SECTION_DELETE: 'Xóa bản ghi danh sách',
};

/** Trạng thái đang trong quy trình (chưa kết thúc). */
export const PROFILE_CHANGE_OPEN_STATUSES: ProfileChangeStatusValue[] = [
  'DRAFT',
  'SUBMITTED',
  'UNIT_APPROVED',
  'RETURNED',
];

const EXTENDED_FIELDS: CadreField[] = EXTENDED_FIELD_GROUPS.flatMap((g) => g.fields);

/** Tra metadata 1 trường scalar mở rộng theo tên. */
export function findExtendedField(name: string): CadreField | undefined {
  return EXTENDED_FIELDS.find((f) => f.name === name);
}

/** Trường scalar mở rộng có nhạy cảm không. */
export function isExtendedFieldSensitive(name: string): boolean {
  return findExtendedField(name)?.sensitive === true;
}

/**
 * 1 thay đổi danh sách có chạm trường nhạy cảm không (dựa trên payload gửi lên).
 * Dùng để đánh dấu ProfileChangeItem.isSensitive cho guard hiển thị/duyệt.
 */
export function isSectionPayloadSensitive(slug: string, payload: Record<string, unknown>): boolean {
  const section = getCadreSection(slug);
  if (!section) return false;
  return section.fields.some((f) => f.sensitive && Object.prototype.hasOwnProperty.call(payload, f.name));
}
