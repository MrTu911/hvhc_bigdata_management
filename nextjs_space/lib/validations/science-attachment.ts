/**
 * Zod schemas – Phase 6: File Minh Chứng (Science Attachments)
 * Dùng cho /api/science/attachments/*
 */
import { z } from 'zod'

export const ATTACHMENT_SENSITIVITY_VALUES = ['NORMAL', 'CONFIDENTIAL', 'SECRET'] as const
export type AttachmentSensitivity = (typeof ATTACHMENT_SENSITIVITY_VALUES)[number]

// 100 MB max cho file minh chứng (nhỏ hơn library 200 MB)
export const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024 * 1024

export const ATTACHMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const SCIENCE_ENTITY_TYPES = [
  'PROPOSAL',
  'PROJECT',
  'PUBLICATION',
  'MILESTONE',
  'PROGRESS_REPORT',
  'EXPENSE',
  'GRANT_DISBURSEMENT',
  'ACCEPTANCE',
  'COUNCIL',          // tài liệu cấp hội đồng (biên bản, phiếu đánh giá toàn hội đồng)
  'COUNCIL_MEETING',  // tài liệu cấp phiên họp cụ thể
  'CLOSURE',
  'MIDTERM_REVIEW',
] as const
export type ScienceEntityType = (typeof SCIENCE_ENTITY_TYPES)[number]

export const ATTACHMENT_CATEGORIES = [
  // Proposal
  'THUYET_MINH_DE_TAI',
  'CV_CHU_NHIEM',
  'THU_GIOI_THIEU',
  // Project
  'HOP_DONG_NGHIEN_CUU',
  'QUYET_DINH_PHE_DUYET',
  // Progress
  'BAO_CAO_TIEN_DO',
  'MINH_CHUNG_MILESTONE',
  // Closure
  'BAO_CAO_TONG_KET',
  'BIEN_BAN_NGHIEM_THU',
  // Publication / Innovation
  'BAN_THAO_CONG_BO',
  'GIAY_CHAP_NHAN_XUAT_BAN',
  'BANG_CHUNG_SANG_KIEN',
  'BANG_DOC_QUYEN',
  // Finance
  'HOA_DON_CHI_TIEU',
  'BIEN_LAI_THU_CHI',
  // Council
  'BIEN_BAN_HOI_DONG',
  'PHIEU_DANH_GIA',
  // General
  'TAI_LIEU_KHAC',
] as const
export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  THUYET_MINH_DE_TAI: 'Thuyết minh đề tài',
  CV_CHU_NHIEM: 'CV chủ nhiệm đề tài',
  THU_GIOI_THIEU: 'Thư giới thiệu / hỗ trợ',
  HOP_DONG_NGHIEN_CUU: 'Hợp đồng nghiên cứu',
  QUYET_DINH_PHE_DUYET: 'Quyết định phê duyệt',
  BAO_CAO_TIEN_DO: 'Báo cáo tiến độ',
  MINH_CHUNG_MILESTONE: 'Minh chứng hoàn thành milestone',
  BAO_CAO_TONG_KET: 'Báo cáo tổng kết',
  BIEN_BAN_NGHIEM_THU: 'Biên bản nghiệm thu',
  BAN_THAO_CONG_BO: 'Bản thảo công bố',
  GIAY_CHAP_NHAN_XUAT_BAN: 'Giấy chấp nhận xuất bản',
  BANG_CHUNG_SANG_KIEN: 'Bằng chứng sáng kiến',
  BANG_DOC_QUYEN: 'Bằng độc quyền sáng chế',
  HOA_DON_CHI_TIEU: 'Hóa đơn / chứng từ chi tiêu',
  BIEN_LAI_THU_CHI: 'Biên lai thu chi',
  BIEN_BAN_HOI_DONG: 'Biên bản họp hội đồng',
  PHIEU_DANH_GIA: 'Phiếu đánh giá',
  TAI_LIEU_KHAC: 'Tài liệu khác',
}

// Danh mục tài liệu phù hợp cho từng loại entity
export const ENTITY_ALLOWED_CATEGORIES: Record<ScienceEntityType, AttachmentCategory[]> = {
  PROPOSAL: ['THUYET_MINH_DE_TAI', 'CV_CHU_NHIEM', 'THU_GIOI_THIEU', 'TAI_LIEU_KHAC'],
  PROJECT: ['HOP_DONG_NGHIEN_CUU', 'QUYET_DINH_PHE_DUYET', 'BAO_CAO_TONG_KET', 'BIEN_BAN_NGHIEM_THU', 'TAI_LIEU_KHAC'],
  PUBLICATION: ['BAN_THAO_CONG_BO', 'GIAY_CHAP_NHAN_XUAT_BAN', 'BANG_CHUNG_SANG_KIEN', 'BANG_DOC_QUYEN', 'TAI_LIEU_KHAC'],
  MILESTONE: ['MINH_CHUNG_MILESTONE', 'TAI_LIEU_KHAC'],
  PROGRESS_REPORT: ['BAO_CAO_TIEN_DO', 'TAI_LIEU_KHAC'],
  EXPENSE: ['HOA_DON_CHI_TIEU', 'TAI_LIEU_KHAC'],
  GRANT_DISBURSEMENT: ['BIEN_LAI_THU_CHI', 'TAI_LIEU_KHAC'],
  ACCEPTANCE: ['BIEN_BAN_NGHIEM_THU', 'TAI_LIEU_KHAC'],
  COUNCIL: ['BIEN_BAN_HOI_DONG', 'PHIEU_DANH_GIA', 'TAI_LIEU_KHAC'],
  COUNCIL_MEETING: ['BIEN_BAN_HOI_DONG', 'PHIEU_DANH_GIA', 'TAI_LIEU_KHAC'],
  CLOSURE: ['BAO_CAO_TONG_KET', 'BIEN_BAN_NGHIEM_THU', 'TAI_LIEU_KHAC'],
  MIDTERM_REVIEW: ['PHIEU_DANH_GIA', 'BAO_CAO_TIEN_DO', 'TAI_LIEU_KHAC'],
}

export const attachmentUploadSchema = z.object({
  entityType: z.enum(SCIENCE_ENTITY_TYPES),
  entityId: z.string().min(1),
  docCategory: z.enum(ATTACHMENT_CATEGORIES),
  title: z.string().min(2).max(300),
  description: z.string().max(1000).optional(),
  sensitivity: z.enum(ATTACHMENT_SENSITIVITY_VALUES).default('NORMAL'),
})
export type AttachmentUploadMeta = z.infer<typeof attachmentUploadSchema>

export const attachmentListQuerySchema = z.object({
  entityType: z.enum(SCIENCE_ENTITY_TYPES),
  entityId: z.string().min(1),
})
