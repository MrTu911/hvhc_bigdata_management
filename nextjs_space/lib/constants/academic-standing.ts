/**
 * Hằng số xếp loại học lực – dùng chung cho service và UI.
 * Nguồn duy nhất cho màu sắc và ngưỡng GPA.
 */

export const ACADEMIC_STANDING_COLORS: Record<string, string> = {
  'Xuất sắc':  '#10b981',
  'Giỏi':      '#3b82f6',
  'Khá':       '#f59e0b',
  'Trung bình':'#ef4444',
  'Yếu':       '#dc2626',
  'Chưa xếp loại': '#9ca3af',
};

export const ACADEMIC_STANDING_THRESHOLDS = {
  xuatSac:   9.0,
  gioi:      8.0,
  kha:       6.5,
  trungBinh: 5.0,
} as const;
