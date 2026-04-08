/**
 * Input Validation Helpers (C3.4)
 * Kiểm tra và làm sạch dữ liệu đầu vào
 */

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .max(255, 'Email quá dài');

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(100, 'Mật khẩu quá dài')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[!@#$%^&*]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)');

export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ');

export const idCardSchema = z
  .string()
  .regex(/^[0-9]{9,12}$/, 'Số CCCD/CMT không hợp lệ');

export const vietnameseNameSchema = z
  .string()
  .min(2, 'Tên quá ngắn')
  .max(100, 'Tên quá dài')
  .regex(
    /^[A-ZÀẠẢÃẤẦẨẪẬẮẰẲẴẶĂÂĐEÈẸẺẼẾỀỂỄỆÊÉIÌỈĨỊÍÒỌỎÕỐỒỔỖỘÔỚỜỞỠỢƠOÓUÙỤỦŨỨỪỬỮỰƯÚÝYỲỴỶỸa-zàạảãấầẩẫậắằẳẵặăâđeèẹẻẽếềểễệêéiìỉĩịíòọỏõốồổỗộôớờởỡợơoóuùụủũứừửữựưúýyỳỵỷỹ ]+$/,
    'Tên chứa ký tự không hợp lệ'
  );

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Ngày tháng không hợp lệ');

export const uuidSchema = z
  .string()
  .uuid('ID không hợp lệ');

// ==================== DOMAIN SCHEMAS ====================

// User schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: vietnameseNameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['QUAN_TRI_HE_THONG', 'CHI_HUY_HOC_VIEN', 'CHI_HUY_KHOA', 'CHU_NHIEM_BO_MON', 'GIANG_VIEN', 'NGHIEN_CUU_SINH', 'KY_THUAT_VIEN', 'HOC_VIEN']).optional()
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: uuidSchema
});

// Student schemas
export const createStudentSchema = z.object({
  maHocVien: z.string().min(3).max(20),
  hoTen: vietnameseNameSchema,
  ngaySinh: dateSchema.optional(),
  gioiTinh: z.enum(['Nam', 'Nữ']).optional(),
  email: emailSchema.optional(),
  soDienThoai: phoneSchema.optional(),
  diaChi: z.string().max(500).optional(),
  lop: z.string().max(50).optional(),
  khoa: z.string().max(100).optional(),
  nganh: z.string().max(100).optional(),
  trangThai: z.enum(['Đang học', 'Tốt nghiệp', 'Bảo lưu', 'Thôi học']).default('Đang học')
});

// Grade schemas
export const createGradeSchema = z.object({
  hocVienId: uuidSchema,
  monHoc: z.string().min(1).max(200),
  maMonHoc: z.string().max(20).optional(),
  diemChuyenCan: z.number().min(0).max(10).optional(),
  diemGiuaKy: z.number().min(0).max(10).optional(),
  diemBaiTap: z.number().min(0).max(10).optional(),
  diemThi: z.number().min(0).max(10).optional(),
  hocKy: z.number().min(1).max(3).optional(),
  namHoc: z.string().regex(/^\d{4}-\d{4}$/).optional()
});

// Research project schemas
export const createResearchSchema = z.object({
  projectName: z.string().min(5).max(500),
  projectCode: z.string().max(50).optional(),
  level: z.enum(['Cấp Cơ sở', 'Cấp Trường', 'Cấp Bộ', 'Cấp Quốc gia']).optional(),
  field: z.string().max(100).optional(),
  fundingAmount: z.number().min(0).optional(),
  startYear: z.string().regex(/^\d{4}$/).optional(),
  endYear: z.string().regex(/^\d{4}$/).optional(),
  facultyId: uuidSchema
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate và parse data theo schema
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Sanitize string input - loại bỏ XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize object - áp dụng sanitizeString cho tất cả string fields
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(result[key] as string);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      (result as Record<string, unknown>)[key] = sanitizeObject(result[key] as Record<string, unknown>);
    }
  }
  return result;
}

/**
 * Format validation errors cho response
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  return errors;
}
