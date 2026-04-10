/**
 * Zod schemas – Phase 4: Thư viện Số
 * Dùng cho /api/science/library/*
 */
import { z } from 'zod'

export const LIBRARY_SENSITIVITY_VALUES = ['NORMAL', 'CONFIDENTIAL', 'SECRET'] as const
export type LibrarySensitivity = (typeof LIBRARY_SENSITIVITY_VALUES)[number]

export const LIBRARY_ACTION_VALUES = ['VIEW', 'DOWNLOAD'] as const

// ─── Upload ───────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024 // 200 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
] as const

export const libraryUploadMetaSchema = z.object({
  title: z.string().min(3).max(300),
  sensitivity: z.enum(LIBRARY_SENSITIVITY_VALUES).default('NORMAL'),
  workId: z.string().cuid().optional(),
})

export type LibraryUploadMeta = z.infer<typeof libraryUploadMetaSchema>

// ─── List filter ──────────────────────────────────────────────────────────────

export const libraryListFilterSchema = z.object({
  keyword: z.string().max(300).optional(),
  sensitivity: z.enum(LIBRARY_SENSITIVITY_VALUES).optional(),
  workId: z.string().cuid().optional(),
  isIndexed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type LibraryListFilter = z.infer<typeof libraryListFilterSchema>

// ─── Semantic search ──────────────────────────────────────────────────────────

export const semanticSearchSchema = z.object({
  query: z.string().min(3).max(500),
  sensitivity: z.enum(LIBRARY_SENSITIVITY_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

export type SemanticSearchInput = z.infer<typeof semanticSearchSchema>
