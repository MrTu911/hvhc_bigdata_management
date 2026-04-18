/**
 * M10 – Shared constants cho Education module
 * Dùng chung cho civil-students, military-students pages và student-table.
 * Nguồn duy nhất cho các mapping label/variant/color — không duplicate trong page.
 */

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE:         'Đang học',
  TEMP_SUSPENDED: 'Tạm ngưng',
  STUDY_DELAY:    'Bảo lưu',
  REPEATING:      'Học lại',
  DROPPED_OUT:    'Thôi học',
  GRADUATED:      'Tốt nghiệp',
  RESERVED:       'Dự bị',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE:         'default',
  TEMP_SUSPENDED: 'secondary',
  STUDY_DELAY:    'secondary',
  REPEATING:      'outline',
  DROPPED_OUT:    'destructive',
  GRADUATED:      'secondary',
  RESERVED:       'outline',
};

export const STATUS_DOT: Record<string, string> = {
  ACTIVE:         'bg-green-500',
  TEMP_SUSPENDED: 'bg-yellow-500',
  STUDY_DELAY:    'bg-orange-400',
  REPEATING:      'bg-blue-400',
  DROPPED_OUT:    'bg-red-500',
  GRADUATED:      'bg-purple-500',
  RESERVED:       'bg-gray-400',
};

// Union của tất cả hệ đào tạo — civil + military, không tách riêng
export const STUDY_MODE_LABELS: Record<string, string> = {
  CHINH_QUY:       'Chính quy',
  TAI_CHUC:        'Tại chức',
  TU_XA:           'Từ xa',
  VAN_BANG_2:      'Văn bằng 2',
  LIEN_THONG:      'Liên thông',
  NGHIEN_CUU_SINH: 'Nghiên cứu sinh',
  THUC_TAP_SINH:   'Thực tập sinh',
  BOI_DUONG:       'Bồi dưỡng',
  SAU_DAI_HOC:     'Sau đại học',
};

export const WARNING_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH:     'bg-orange-100 text-orange-700',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  LOW:      'bg-blue-100 text-blue-700',
};
