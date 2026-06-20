/**
 * Hằng số cho vòng đời "khai báo hồ sơ lần đầu" (profile declaration lifecycle).
 *
 * Giai đoạn khai báo (User.profileDeclaredAt = null): cán bộ tự ghi trực tiếp HSCB.
 * Sau khi "Xác nhận hoàn tất khai báo" → khóa → mọi thay đổi đi qua đề nghị 2 cấp.
 */

/**
 * Trường mở rộng (scalar trên User) do CHỈ HUY/M02 quản lý — KHÔNG cho tự khai trực
 * tiếp kể cả lúc khai báo lần đầu (vẫn theo kênh duyệt). rank/unitId/position vốn
 * không nằm trong cadre-extended nên không cần liệt kê ở đây.
 */
export const DECLARATION_LOCKED_EXTENDED_FIELDS = new Set<string>(['managementCategory']);

export interface DeclarationCheck {
  key: string;
  label: string;
}

/**
 * Các mục TỐI THIỂU phải có trước khi cho "Xác nhận hoàn tất khai báo".
 * Chỉ gồm mục mà cán bộ thực sự khai báo được qua self-service.
 */
export const DECLARATION_REQUIRED_CHECKS: DeclarationCheck[] = [
  { key: 'basicInfo', label: 'Thông tin cơ bản (họ tên, ngày sinh, giới tính)' },
  { key: 'careerHistory', label: 'Ít nhất 1 quá trình công tác' },
];
