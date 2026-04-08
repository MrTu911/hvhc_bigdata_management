/**
 * Zod Validation Schemas – Module M09 NCKH
 * UC-45: ResearchProject, ResearchMilestone, ResearchReview
 */

import { z } from 'zod'
import {
  NckhCategory,
  NckhType,
  NckhField,
  NckhMemberRole,
  NckhMilestoneStatus,
  NckhReviewType,
  NckhReviewDecision,
} from '@prisma/client'

// ─── ResearchProject ──────────────────────────────────────────────────────────

export const nckhProjectCreateSchema = z.object({
  projectCode: z
    .string()
    .min(1, 'Mã đề tài là bắt buộc')
    .regex(/^[A-Z0-9\-]+$/, 'Mã đề tài chỉ được dùng chữ hoa, số và dấu gạch ngang'),
  title: z.string().min(5, 'Tên đề tài tối thiểu 5 ký tự').max(500, 'Tên đề tài tối đa 500 ký tự'),
  titleEn: z.string().max(500).optional().nullable(),
  abstract: z.string().max(3000, 'Tóm tắt tối đa 3000 ký tự').optional().nullable(),
  keywords: z.array(z.string().min(1)).max(10, 'Tối đa 10 từ khóa').default([]),
  category: z.nativeEnum(NckhCategory, { required_error: 'Chọn cấp đề tài' }),
  field: z.nativeEnum(NckhField, { required_error: 'Chọn lĩnh vực khoa học' }),
  researchType: z.nativeEnum(NckhType, { required_error: 'Chọn loại hình nghiên cứu' }),
  principalInvestigatorId: z.string().min(1, 'Chọn chủ nhiệm đề tài'),
  unitId: z.string().optional().nullable(),
  budgetRequested: z.number().min(0, 'Kinh phí không hợp lệ').optional().nullable(),
  budgetYear: z
    .number()
    .int()
    .min(2000)
    .max(2100)
    .optional()
    .nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export const nckhProjectUpdateSchema = nckhProjectCreateSchema
  .partial()
  .omit({ projectCode: true, principalInvestigatorId: true })
  .extend({
    budgetApproved: z.number().min(0).optional().nullable(),
    budgetUsed: z.number().min(0).optional().nullable(),
    actualEndDate: z.string().optional().nullable(),
  })

export type NckhProjectCreateInput = z.infer<typeof nckhProjectCreateSchema>
export type NckhProjectUpdateInput = z.infer<typeof nckhProjectUpdateSchema>

// ─── ResearchMember ───────────────────────────────────────────────────────────

export const nckhMemberAddSchema = z.object({
  userId: z.string().min(1, 'Chọn thành viên'),
  role: z.nativeEnum(NckhMemberRole, { required_error: 'Chọn vai trò' }),
  contribution: z
    .number()
    .min(0)
    .max(100, '% đóng góp từ 0 đến 100')
    .optional()
    .nullable(),
  joinDate: z.string().optional().nullable(),
})

export type NckhMemberAddInput = z.infer<typeof nckhMemberAddSchema>

// ─── ResearchMilestone ────────────────────────────────────────────────────────

export const nckhMilestoneCreateSchema = z.object({
  title: z.string().min(3, 'Tên mốc tối thiểu 3 ký tự').max(200),
  dueDate: z.string().min(1, 'Ngày hạn là bắt buộc'),
  note: z.string().max(1000).optional().nullable(),
  attachmentUrl: z.string().url('URL không hợp lệ').optional().nullable(),
})

export const nckhMilestoneUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  dueDate: z.string().optional(),
  status: z.nativeEnum(NckhMilestoneStatus).optional(),
  completedAt: z.string().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
})

export type NckhMilestoneCreateInput = z.infer<typeof nckhMilestoneCreateSchema>
export type NckhMilestoneUpdateInput = z.infer<typeof nckhMilestoneUpdateSchema>

// ─── ResearchReview (Nghiệm thu) ──────────────────────────────────────────────

export const nckhReviewCreateSchema = z.object({
  reviewType: z.nativeEnum(NckhReviewType, { required_error: 'Chọn loại nghiệm thu' }),
  reviewDate: z.string().min(1, 'Ngày nghiệm thu là bắt buộc'),
  score: z.number().min(0).max(100, 'Điểm từ 0 đến 100').optional().nullable(),
  grade: z
    .enum(['Xuất sắc', 'Tốt', 'Khá', 'Đạt', 'Không đạt'])
    .optional()
    .nullable(),
  decision: z.nativeEnum(NckhReviewDecision, { required_error: 'Chọn kết luận nghiệm thu' }),
  comments: z.string().max(2000).optional().nullable(),
  minutesUrl: z.string().url('URL biên bản không hợp lệ').optional().nullable(),
})

export type NckhReviewCreateInput = z.infer<typeof nckhReviewCreateSchema>
