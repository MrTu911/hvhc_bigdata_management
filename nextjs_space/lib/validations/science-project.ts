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
  COMPLETED:    ['ARCHIVED'],
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
