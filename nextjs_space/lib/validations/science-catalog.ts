/**
 * Zod Validation Schemas – CSDL-KHQL Phase 1
 * ScienceCatalog: danh mục lĩnh vực, loại công trình, nhà xuất bản, nguồn kinh phí...
 */

import { z } from 'zod'

// ─── Catalog type values ───────────────────────────────────────────────────────
// FIELD: Lĩnh vực nghiên cứu
// WORK_TYPE: Loại công trình (bài báo, sách, giáo trình...)
// PUBLISHER: Nhà xuất bản / tạp chí
// FUND_SOURCE: Nguồn kinh phí (Bộ QP, Học viện, Nhà nước...)
// LEVEL: Cấp đề tài (cấp cơ sở, cấp học viện, cấp bộ...)
// RESEARCH_AREA: Chuyên ngành cụ thể (sub-FIELD)
export const SCIENCE_CATALOG_TYPES = [
  'FIELD',
  'WORK_TYPE',
  'PUBLISHER',
  'FUND_SOURCE',
  'LEVEL',
  'RESEARCH_AREA',
] as const

export type ScienceCatalogType = (typeof SCIENCE_CATALOG_TYPES)[number]

// ─── Create ────────────────────────────────────────────────────────────────────
export const scienceCatalogCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tên danh mục tối thiểu 2 ký tự')
    .max(200, 'Tên danh mục tối đa 200 ký tự'),
  type: z.enum(SCIENCE_CATALOG_TYPES, {
    required_error: 'Loại danh mục là bắt buộc',
    invalid_type_error: 'Loại danh mục không hợp lệ',
  }),
  parentId: z.string().cuid('ID danh mục cha không hợp lệ').optional().nullable(),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .optional()
    .nullable(),
})

export type ScienceCatalogCreateInput = z.infer<typeof scienceCatalogCreateSchema>

// ─── Update ────────────────────────────────────────────────────────────────────
export const scienceCatalogUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  // type và parentId không cho phép thay đổi sau khi tạo
})

export type ScienceCatalogUpdateInput = z.infer<typeof scienceCatalogUpdateSchema>

// ─── List filter ───────────────────────────────────────────────────────────────
export const scienceCatalogListSchema = z.object({
  type: z.enum(SCIENCE_CATALOG_TYPES).optional(),
  parentId: z.string().optional().nullable(),
  keyword: z.string().max(100).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'false' ? false : v === 'true' ? true : undefined)),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v)) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, v ? parseInt(v) : 50))),
})

export type ScienceCatalogListFilter = z.infer<typeof scienceCatalogListSchema>

// ─── Generate code ─────────────────────────────────────────────────────────────
export const scienceCatalogGenerateCodeSchema = z.object({
  type: z.enum(SCIENCE_CATALOG_TYPES, {
    required_error: 'Loại entity là bắt buộc để tạo mã',
  }),
  year: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .default(new Date().getFullYear()),
})

export type ScienceCatalogGenerateCodeInput = z.infer<typeof scienceCatalogGenerateCodeSchema>
