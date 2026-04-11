/**
 * Zod schemas – Phase 3: Đề tài NCKH (NckhProject wrapper)
 * Dùng cho /api/science/projects/*
 */
import { z } from 'zod'

// ─── Enums (mirror Prisma enums, tránh import prisma client ở validation layer) ─

export const PROJECT_STATUS_VALUES = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED',
  'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED',
] as const
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

export const PROJECT_PHASE_VALUES = [
  'PROPOSAL', 'CONTRACT', 'EXECUTION', 'MIDTERM_REVIEW',
  'FINAL_REVIEW', 'ACCEPTED', 'ARCHIVED',
] as const
export type ProjectPhase = (typeof PROJECT_PHASE_VALUES)[number]

export const PROJECT_SENSITIVITY_VALUES = ['NORMAL', 'CONFIDENTIAL', 'SECRET'] as const
export type ProjectSensitivity = (typeof PROJECT_SENSITIVITY_VALUES)[number]

// ─── Valid workflow transitions ───────────────────────────────────────────────
// Dùng trong service để guard chuyển trạng thái hợp lệ.
export const VALID_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT:        ['SUBMITTED', 'CANCELLED'],
  SUBMITTED:    ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED:     ['IN_PROGRESS', 'CANCELLED'],
  REJECTED:     ['DRAFT'],
  IN_PROGRESS:  ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED:       ['IN_PROGRESS', 'CANCELLED'],
  // COMPLETED → ARCHIVED là phase change, không phải status change.
  // Dùng POST /api/science/projects/:id/archive thay vì workflow route.
  COMPLETED:    [],
  CANCELLED:    [],
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const projectCreateSchema = z.object({
  title: z.string().min(5).max(500),
  titleEn: z.string().max(500).optional(),
  abstract: z.string().max(5000).optional(),
  keywords: z.array(z.string().max(100)).default([]),
  category: z.enum(['CAP_HOC_VIEN', 'CAP_TONG_CUC', 'CAP_BO_QUOC_PHONG', 'CAP_NHA_NUOC', 'SANG_KIEN_CO_SO']),
  field: z.enum(['HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT', 'KHOA_HOC_XA_HOI', 'KHOA_HOC_TU_NHIEN', 'CNTT', 'Y_DUOC', 'KHAC']),
  researchType: z.enum(['CO_BAN', 'UNG_DUNG', 'TRIEN_KHAI', 'SANG_KIEN_KINH_NGHIEM']),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budgetRequested: z.number().min(0).optional(),
  budgetYear: z.number().int().min(2000).max(2100).optional(),
  unitId: z.string().cuid().optional(),
  fundSourceId: z.string().cuid().optional(),
  sensitivity: z.enum(PROJECT_SENSITIVITY_VALUES).default('NORMAL'),
  bqpProjectCode: z.string().max(100).optional(),
})

export const projectUpdateSchema = projectCreateSchema.partial()

export const projectListFilterSchema = z.object({
  keyword: z.string().max(300).optional(),
  status: z.enum(PROJECT_STATUS_VALUES).optional(),
  phase: z.enum(PROJECT_PHASE_VALUES).optional(),
  category: z.string().optional(),
  sensitivity: z.enum(PROJECT_SENSITIVITY_VALUES).optional(),
  unitId: z.string().cuid().optional(),
  budgetYear: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const workflowTransitionSchema = z.object({
  toStatus: z.enum(PROJECT_STATUS_VALUES),
  toPhase: z.enum(PROJECT_PHASE_VALUES).optional(),
  comment: z.string().max(2000).optional(),
})

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type ProjectListFilter = z.infer<typeof projectListFilterSchema>
export type WorkflowTransitionInput = z.infer<typeof workflowTransitionSchema>

// ─── Lock rule ────────────────────────────────────────────────────────────────
// Trạng thái không cho phép sửa đề tài (lock)
// ARCHIVED is a phase value, not a status — lock check: status=CANCELLED || phase=ARCHIVED
export const LOCKED_STATUSES = new Set<ProjectStatus>(['CANCELLED'])

// ─── Milestone schemas ────────────────────────────────────────────────────────

export const MILESTONE_STATUS_VALUES = [
  'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED',
] as const
export type MilestoneStatus = (typeof MILESTONE_STATUS_VALUES)[number]

export const milestoneCreateSchema = z.object({
  title: z.string().min(3).max(300),
  dueDate: z.coerce.date(),
  note: z.string().max(1000).optional(),
  attachmentUrl: z.string().url().optional(),
})

export const milestoneUpdateSchema = z.object({
  title: z.string().min(3).max(300).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(MILESTONE_STATUS_VALUES).optional(),
  completedAt: z.coerce.date().optional(),
  note: z.string().max(1000).optional(),
  attachmentUrl: z.string().url().optional(),
})

export type MilestoneCreateInput = z.infer<typeof milestoneCreateSchema>
export type MilestoneUpdateInput = z.infer<typeof milestoneUpdateSchema>

// ─── Acceptance (nghiệm thu) schemas ─────────────────────────────────────────

export const REVIEW_TYPE_VALUES = [
  'THAM_DINH_DE_CUONG',
  'KIEM_TRA_GIUA_KY',
  'NGHIEM_THU_CO_SO',
  'NGHIEM_THU_CAP_HV',
  'NGHIEM_THU_CAP_TREN',
] as const
export type ReviewType = (typeof REVIEW_TYPE_VALUES)[number]

export const REVIEW_DECISION_VALUES = ['PASSED', 'FAILED', 'REVISION_REQUIRED'] as const
export type ReviewDecision = (typeof REVIEW_DECISION_VALUES)[number]

export const acceptanceSubmitSchema = z.object({
  reviewType: z.enum(REVIEW_TYPE_VALUES),
  reviewDate: z.coerce.date(),
  score: z.number().min(0).max(10).optional(),
  grade: z.string().max(50).optional(),
  comments: z.string().max(3000).optional(),
  decision: z.enum(REVIEW_DECISION_VALUES),
  minutesUrl: z.string().url().optional(),
})

export type AcceptanceSubmitInput = z.infer<typeof acceptanceSubmitSchema>

// ─── Archive schemas ──────────────────────────────────────────────────────────

export const archiveTransitionSchema = workflowTransitionSchema.extend({
  completionScore: z.number().min(0).max(10).optional(),
  completionGrade: z.string().max(50).optional(),
})

export type ArchiveTransitionInput = z.infer<typeof archiveTransitionSchema>
