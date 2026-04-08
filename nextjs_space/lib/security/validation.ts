/**
 * HVHC BigData Management System
 * Input Validation Schemas với Zod
 */

import { z } from 'zod';

// ===== COMMON SCHEMAS =====

// Mã CCCD/CMT (12 số cho CCCD mới, 9 số cho CMT cũ)
export const cccdSchema = z
  .string()
  .regex(/^\d{9,12}$/, 'CCCD/CMT phải có 9-12 chữ số');

// Email quân đội hoặc email thường
export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .max(100, 'Email quá dài');

// Số điện thoại Việt Nam
export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ');

// Mã nhân viên
export const employeeIdSchema = z
  .string()
  .min(3, 'Mã nhân viên quá ngắn')
  .max(20, 'Mã nhân viên quá dài');

// Tên người (có dấu tiếng Việt)
export const nameSchema = z
  .string()
  .min(2, 'Tên quá ngắn')
  .max(100, 'Tên quá dài')
  .regex(/^[\p{L}\s]+$/u, 'Tên chỉ được chứa chữ cái và khoảng trắng');

// Password mạnh
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(100, 'Mật khẩu quá dài')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
  .regex(/[!@#$%^&*]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)');

// UUID
export const uuidSchema = z.string().uuid('ID không hợp lệ');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Date string
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (YYYY-MM-DD)');

// ===== USER SCHEMAS =====

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  employeeId: employeeIdSchema.optional(),
  phone: phoneSchema.optional()
});

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  address: z.string().max(500).optional(),
  dateOfBirth: dateStringSchema.optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
});

// ===== PERSONNEL SCHEMAS =====

export const createPersonnelSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  employeeId: employeeIdSchema,
  cccd: cccdSchema.optional(),
  phone: phoneSchema.optional(),
  rank: z.string().max(50).optional(),
  position: z.string().max(100).optional(),
  unitId: uuidSchema.optional(),
  dateOfBirth: dateStringSchema.optional(),
  startDate: dateStringSchema.optional()
});

export const updatePersonnelSchema = createPersonnelSchema.partial();

// ===== STUDENT SCHEMAS =====

export const createStudentSchema = z.object({
  maHocVien: z.string().min(3).max(20),
  hoTen: nameSchema,
  ngaySinh: dateStringSchema.optional(),
  gioiTinh: z.enum(['Nam', 'Nữ']).optional(),
  soDienThoai: phoneSchema.optional(),
  email: emailSchema.optional(),
  lop: z.string().max(50).optional(),
  khoa: z.string().max(100).optional(),
  nganh: z.string().max(100).optional(),
  namNhapHoc: z.coerce.number().int().min(2000).max(2100).optional(),
  trangThai: z.string().max(20).optional()
});

export const updateStudentSchema = createStudentSchema.partial();

// ===== GRADE SCHEMAS =====

export const createGradeSchema = z.object({
  hocVienId: uuidSchema,
  maMon: z.string().min(2).max(20),
  tenMon: z.string().min(2).max(100),
  hocKy: z.coerce.number().int().min(1).max(3),
  namHoc: z.string().regex(/^\d{4}-\d{4}$/, 'Năm học phải có dạng YYYY-YYYY'),
  diemChuyenCan: z.coerce.number().min(0).max(10).optional(),
  diemGiuaKy: z.coerce.number().min(0).max(10).optional(),
  diemBaiTap: z.coerce.number().min(0).max(10).optional(),
  diemThi: z.coerce.number().min(0).max(10).optional()
});

export const updateGradeSchema = createGradeSchema.partial().extend({
  id: uuidSchema
});

// ===== RESEARCH SCHEMAS =====

export const createResearchSchema = z.object({
  facultyId: uuidSchema,
  projectName: z.string().min(10, 'Tên đề tài quá ngắn').max(500),
  description: z.string().max(5000).optional(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  budget: z.coerce.number().min(0).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional()
});

export const updateResearchSchema = createResearchSchema.partial();

// ===== POLICY SCHEMAS =====

export const createPolicyRequestSchema = z.object({
  categoryId: uuidSchema,
  title: z.string().min(10, 'Tiêu đề quá ngắn').max(500),
  description: z.string().max(5000).optional(),
  requestedAmount: z.coerce.number().min(0).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
});

export const updatePolicyRequestSchema = createPolicyRequestSchema.partial();

// ===== INSURANCE SCHEMAS =====

export const createInsuranceHistorySchema = z.object({
  insuranceInfoId: uuidSchema,
  transactionType: z.enum(['CONTRIBUTION', 'BENEFIT']),
  amount: z.coerce.number().min(0),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  description: z.string().max(1000).optional()
});

export const updateInsuranceHistorySchema = createInsuranceHistorySchema.partial();

// ===== UTILITY FUNCTIONS =====

/**
 * Validate input với schema và trả về result
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError['errors'];
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.errors };
}

/**
 * Sanitize string input - loại bỏ các ký tự nguy hiểm
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[^>]*?>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Validate và sanitize object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(sanitized[key] as string);
    }
  }
  return sanitized;
}

export default {
  // Schemas
  loginSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  createPersonnelSchema,
  updatePersonnelSchema,
  createStudentSchema,
  updateStudentSchema,
  createGradeSchema,
  updateGradeSchema,
  createResearchSchema,
  updateResearchSchema,
  createPolicyRequestSchema,
  updatePolicyRequestSchema,
  createInsuranceHistorySchema,
  updateInsuranceHistorySchema,
  paginationSchema,
  // Utils
  validateInput,
  sanitizeString,
  sanitizeObject
};
