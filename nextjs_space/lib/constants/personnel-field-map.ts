/**
 * Mapping trường hồ sơ giữa account `User` và bản ghi gốc `Personnel` (M02 master).
 *
 * BỐI CẢNH liên thông: hồ sơ cá nhân được sửa trên `User` (qua self-service trực tiếp
 * hoặc luồng duyệt 2 cấp ProfileChangeRequest). Nhưng dashboard/CSDL chính phục vụ lãnh
 * đạo đọc theo `Personnel` (M02 — nguồn sự thật cho "người"). Để tránh 2 nguồn sự thật
 * lệch nhau, mọi thay đổi trường MÔ TẢ NHÂN THÂN dùng chung phải được CHIẾU sang
 * `Personnel`. Map này là nguồn khai báo DUY NHẤT cho phép chiếu đó.
 *
 * Quy ước key/value: `User.<key>` → `Personnel.<value>`.
 *
 * KHÔNG đưa vào đây các trường QUYẾT ĐỊNH CHỈ HUY (cấp bậc/đơn vị/chức vụ):
 *   rank, unitId, positionId, position, militaryIdNumber, enlistmentDate, dischargeDate.
 * Những trường đó do quy trình điều động / phong quân hàm (RankDeclaration, điều động,
 * bổ nhiệm) ghi THẲNG vào `Personnel`/`OfficerCareer`, không qua self-service hồ sơ.
 * Xem docs/design/personal-space-data-flow.md (ma trận quyền sửa trường).
 */
export const USER_TO_PERSONNEL_FIELD_MAP: Record<string, string> = {
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  ethnicity: 'ethnicity',
  religion: 'religion',
  birthPlace: 'birthPlace',
  placeOfOrigin: 'placeOfOrigin',
  permanentAddress: 'permanentAddress',
  temporaryAddress: 'temporaryAddress',
  bloodType: 'bloodType',
  educationLevel: 'educationLevel',
  specialization: 'specialization',
  academicTitle: 'academicTitle',
};

/** Tập key trường `User` được chiếu sang `Personnel` (tra cứu nhanh). */
export const PERSONNEL_PROJECTED_USER_KEYS = new Set(Object.keys(USER_TO_PERSONNEL_FIELD_MAP));
