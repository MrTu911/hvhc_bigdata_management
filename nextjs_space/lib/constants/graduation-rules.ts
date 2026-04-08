/**
 * Graduation Rule Constants – M10 UC-60
 *
 * Single source of truth cho các ngưỡng xét tốt nghiệp.
 * Dùng ở: graduation engine, warning engine, seed scripts, UAT.
 */

/** Thang điểm 10. Ngưỡng GPA tối thiểu để xét tốt nghiệp. */
export const MIN_GPA_FOR_GRADUATION = 5.0;

/** Điểm rèn luyện tối thiểu (trên thang 100) để đủ điều kiện rèn luyện. */
export const MIN_CONDUCT_SCORE_FOR_GRADUATION = 50;

/**
 * Thesis status transitions hợp lệ (one-way).
 * Key = trạng thái hiện tại, value = danh sách trạng thái hợp lệ tiếp theo.
 */
export const THESIS_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:       ['IN_PROGRESS'],
  IN_PROGRESS: ['DEFENDED'],
  DEFENDED:    ['ARCHIVED'],
  ARCHIVED:    [], // trạng thái cuối, không thể chuyển
};

/** Tín chỉ tối thiểu mặc định nếu không tìm thấy ProgramVersion. */
export const DEFAULT_REQUIRED_CREDITS = 120;
