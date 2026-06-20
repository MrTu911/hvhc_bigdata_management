/**
 * Validation schemas – Duyệt cập nhật hồ sơ cán bộ theo phân cấp.
 *
 * Một đề nghị gồm nhiều "mục thay đổi" (item) + minh chứng. Mỗi item nhắm tới
 * 1 trường scalar mở rộng (EXTENDED_FIELD) hoặc 1 thao tác trên danh sách HSCB
 * (SECTION_CREATE/UPDATE/DELETE). Slug/field được validate sâu hơn ở service
 * dựa trên metadata cadre-profile-sections.
 */
import { z } from 'zod';

export const profileChangeItemSchema = z
  .object({
    itemType: z.enum(['EXTENDED_FIELD', 'SECTION_CREATE', 'SECTION_UPDATE', 'SECTION_DELETE']),
    /** EXTENDED_FIELD */
    fieldName: z.string().min(1).max(100).optional(),
    /** SECTION_* */
    sectionSlug: z.string().min(1).max(100).optional(),
    /** SECTION_UPDATE / SECTION_DELETE */
    targetRecordId: z.string().min(1).max(64).optional(),
    /** Giá trị hiện tại (snapshot để hiển thị diff) */
    currentValue: z.string().max(5000).optional().nullable(),
    /** Giá trị mới: scalar (EXTENDED_FIELD) hoặc payload bản ghi (SECTION_*) */
    requestedValue: z.unknown().optional(),
  })
  .superRefine((item, ctx) => {
    if (item.itemType === 'EXTENDED_FIELD' && !item.fieldName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'EXTENDED_FIELD cần fieldName', path: ['fieldName'] });
    }
    if (item.itemType.startsWith('SECTION_') && !item.sectionSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SECTION_* cần sectionSlug', path: ['sectionSlug'] });
    }
    if ((item.itemType === 'SECTION_UPDATE' || item.itemType === 'SECTION_DELETE') && !item.targetRecordId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'SECTION_UPDATE/DELETE cần targetRecordId', path: ['targetRecordId'] });
    }
    if (item.itemType !== 'SECTION_DELETE' && (item.requestedValue === undefined || item.requestedValue === null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần requestedValue', path: ['requestedValue'] });
    }
  });

export const profileChangeCreateSchema = z.object({
  /** Cho phép cán bộ đề nghị cho chính mình; admin/HR có thể nhắm userId khác (kiểm ở service) */
  targetUserId: z.string().min(1).max(64).optional(),
  title: z.string().max(300).optional().nullable(),
  reason: z.string().max(2000).optional().nullable(),
  items: z.array(profileChangeItemSchema).min(1, 'Cần ít nhất 1 mục thay đổi'),
  /** true = gửi duyệt ngay; false/absent = lưu nháp */
  submit: z.boolean().optional(),
});

export const profileChangeUpdateDraftSchema = z.object({
  title: z.string().max(300).optional().nullable(),
  reason: z.string().max(2000).optional().nullable(),
  items: z.array(profileChangeItemSchema).min(1).optional(),
});

export const profileChangeActionSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2)]),
  action: z.enum(['APPROVE', 'REJECT', 'RETURN']),
  note: z.string().max(2000).optional().nullable(),
});

export type ProfileChangeItemInput = z.infer<typeof profileChangeItemSchema>;
export type ProfileChangeCreateInput = z.infer<typeof profileChangeCreateSchema>;
export type ProfileChangeActionInput = z.infer<typeof profileChangeActionSchema>;
