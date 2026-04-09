/**
 * Zod schemas – Phase 2: Hồ sơ Nhà Khoa học
 * Dùng cho các API tại /api/science/scientists/*
 */
import { z } from 'zod'

// ─── Education ────────────────────────────────────────────────────────────────

export const DEGREE_VALUES = ['TSKH', 'TS', 'ThS', 'CN', 'KS', 'CK1', 'CK2'] as const
export type Degree = (typeof DEGREE_VALUES)[number]

export const scientistEducationCreateSchema = z.object({
  degree: z.enum(DEGREE_VALUES),
  major: z.string().min(2).max(200),
  institution: z.string().min(2).max(300),
  country: z.string().min(2).max(100).default('Việt Nam'),
  yearFrom: z.number().int().min(1950).max(2100),
  yearTo: z.number().int().min(1950).max(2100),
  thesisTitle: z.string().max(500).optional(),
})

export const scientistEducationUpdateSchema = scientistEducationCreateSchema.partial()

export type ScientistEducationCreateInput = z.infer<typeof scientistEducationCreateSchema>
export type ScientistEducationUpdateInput = z.infer<typeof scientistEducationUpdateSchema>

// ─── Career ──────────────────────────────────────────────────────────────────

export const scientistCareerCreateSchema = z.object({
  position: z.string().min(2).max(200),
  unitName: z.string().min(2).max(300),
  yearFrom: z.number().int().min(1950).max(2100),
  yearTo: z.number().int().min(1950).max(2100).optional(),
  isCurrent: z.boolean().default(false),
})

export const scientistCareerUpdateSchema = scientistCareerCreateSchema.partial()

export type ScientistCareerCreateInput = z.infer<typeof scientistCareerCreateSchema>
export type ScientistCareerUpdateInput = z.infer<typeof scientistCareerUpdateSchema>

// ─── Award ───────────────────────────────────────────────────────────────────

export const AWARD_LEVEL_VALUES = ['MINISTRY', 'ACADEMY', 'DEPARTMENT', 'INTERNATIONAL'] as const
export type AwardLevel = (typeof AWARD_LEVEL_VALUES)[number]

export const scientistAwardCreateSchema = z.object({
  awardName: z.string().min(2).max(300),
  level: z.enum(AWARD_LEVEL_VALUES),
  year: z.number().int().min(1950).max(2100),
  projectId: z.string().cuid().optional(),
  description: z.string().max(1000).optional(),
})

export const scientistAwardUpdateSchema = scientistAwardCreateSchema.partial()

export type ScientistAwardCreateInput = z.infer<typeof scientistAwardCreateSchema>
export type ScientistAwardUpdateInput = z.infer<typeof scientistAwardUpdateSchema>

// ─── Profile update ──────────────────────────────────────────────────────────

export const SENSITIVITY_VALUES = ['NORMAL', 'CONFIDENTIAL'] as const

export const scientistProfileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  primaryField: z.string().max(200).optional(),
  secondaryFields: z.array(z.string().max(200)).optional(),
  researchKeywords: z.array(z.string().max(100)).optional(),
  researchFields: z.array(z.string().max(200)).optional(),
  specialization: z.string().max(200).optional(),
  orcidId: z.string().max(100).optional(),
  scopusAuthorId: z.string().max(100).optional(),
  googleScholarId: z.string().max(100).optional(),
  sensitivityLevel: z.enum(SENSITIVITY_VALUES).optional(),
  researchAreaIds: z.array(z.string().cuid()).optional(),
})

export type ScientistProfileUpdateInput = z.infer<typeof scientistProfileUpdateSchema>

// ─── List filter ─────────────────────────────────────────────────────────────

export const scientistListFilterSchema = z.object({
  keyword: z.string().max(200).optional(),
  primaryField: z.string().max(200).optional(),
  researchAreaId: z.string().cuid().optional(),
  sensitivityLevel: z.enum(SENSITIVITY_VALUES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type ScientistListFilter = z.infer<typeof scientistListFilterSchema>
