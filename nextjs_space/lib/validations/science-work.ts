/**
 * Zod schemas – Phase 3: Công trình KH (ScientificWork)
 * Dùng cho /api/science/works/*
 */
import { z } from 'zod'

// ─── Constants ────────────────────────────────────────────────────────────────

export const WORK_TYPE_VALUES = [
  'TEXTBOOK', 'BOOK', 'MONOGRAPH', 'REFERENCE', 'CURRICULUM',
] as const
export type WorkType = (typeof WORK_TYPE_VALUES)[number]

export const WORK_AUTHOR_ROLE_VALUES = ['LEAD', 'CO_AUTHOR', 'EDITOR', 'REVIEWER'] as const
export type WorkAuthorRole = (typeof WORK_AUTHOR_ROLE_VALUES)[number]

export const WORK_SENSITIVITY_VALUES = ['NORMAL', 'CONFIDENTIAL', 'SECRET'] as const

// ─── Author schema ────────────────────────────────────────────────────────────

export const workAuthorSchema = z.object({
  scientistId: z.string().cuid().optional(),
  authorName: z.string().min(2).max(200),
  role: z.enum(WORK_AUTHOR_ROLE_VALUES),
  orderNum: z.number().int().min(1),
  affiliation: z.string().max(300).optional(),
})

// ─── Work schemas ─────────────────────────────────────────────────────────────

export const workCreateSchema = z.object({
  type: z.enum(WORK_TYPE_VALUES),
  title: z.string().min(3).max(500),
  subtitle: z.string().max(300).optional(),
  isbn: z.string().max(20).optional(),
  issn: z.string().max(20).optional(),
  doi: z.string().max(200).optional(),
  publisherId: z.string().cuid().optional(),
  journalName: z.string().max(300).optional(),
  year: z.number().int().min(1950).max(2100),
  edition: z.number().int().min(1).default(1),
  sensitivity: z.enum(WORK_SENSITIVITY_VALUES).default('NORMAL'),
  authors: z.array(workAuthorSchema).min(1),
})

export const workUpdateSchema = workCreateSchema.omit({ authors: true }).partial().extend({
  authors: z.array(workAuthorSchema).min(1).optional(),
})

export const workListFilterSchema = z.object({
  keyword: z.string().max(300).optional(),
  type: z.enum(WORK_TYPE_VALUES).optional(),
  year: z.coerce.number().int().optional(),
  sensitivity: z.enum(WORK_SENSITIVITY_VALUES).optional(),
  scientistId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── CrossRef / DOI import ───────────────────────────────────────────────────

export const crossrefImportSchema = z.object({
  doi: z.string().min(5).max(200),
})

// ─── Duplicate check ──────────────────────────────────────────────────────────

export const duplicateCheckSchema = z.object({
  title: z.string().min(3).max(500),
  abstract: z.string().max(5000).optional(),
  // threshold mặc định 0.80, override nếu cần
  threshold: z.number().min(0).max(1).default(0.80),
})

export type WorkCreateInput = z.infer<typeof workCreateSchema>
export type WorkUpdateInput = z.infer<typeof workUpdateSchema>
export type WorkListFilter = z.infer<typeof workListFilterSchema>
export type WorkAuthorInput = z.infer<typeof workAuthorSchema>
export type CrossrefImportInput = z.infer<typeof crossrefImportSchema>
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>
