/**
 * Zod Validation Schemas – Module M09 UC-46
 * NckhPublication: công bố khoa học và sáng kiến
 */

import { z } from 'zod'
import { NckhPublicationType, NckhPublicationStatus } from '@prisma/client'

const currentYear = new Date().getFullYear()

// ─── PublicationAuthor ────────────────────────────────────────────────────────

const publicationAuthorSchema = z.object({
  userId: z.string().optional().nullable(),
  authorName: z.string().min(1, 'Tên tác giả là bắt buộc'),
  authorOrder: z.number().int().positive('Thứ tự tác giả phải dương'),
  affiliation: z.string().max(300).optional().nullable(),
  isInternal: z.boolean().default(false),
})

// ─── NckhPublication Create ───────────────────────────────────────────────────

export const nckhPublicationCreateSchema = z.object({
  // Thông tin cơ bản (bắt buộc)
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự').max(1000, 'Tiêu đề tối đa 1000 ký tự'),
  pubType: z.nativeEnum(NckhPublicationType, { required_error: 'Chọn loại công bố' }),
  publishedYear: z
    .number({ required_error: 'Năm công bố là bắt buộc' })
    .int()
    .min(1900, 'Năm không hợp lệ')
    .max(currentYear + 1, 'Năm không hợp lệ'),

  // Mô tả
  titleEn: z.string().max(1000).optional().nullable(),
  abstract: z.string().max(5000).optional().nullable(),
  keywords: z.array(z.string().min(1)).max(20, 'Tối đa 20 từ khóa').default([]),
  authorsText: z.string().max(2000).optional().nullable(),

  // Thư mục / định danh
  doi: z
    .string()
    .max(200)
    .regex(/^10\.\d{4,}/, { message: 'DOI phải bắt đầu bằng "10." theo chuẩn' })
    .optional()
    .nullable(),
  isbn: z.string().max(30).optional().nullable(),
  issn: z
    .string()
    .max(20)
    .regex(/^\d{4}-?\d{3}[\dX]$/, { message: 'ISSN không đúng định dạng (ví dụ: 1234-5678)' })
    .optional()
    .nullable(),

  // Tạp chí / hội thảo / NXB
  journal: z.string().max(500).optional().nullable(),
  volume: z.string().max(50).optional().nullable(),
  issue: z.string().max(50).optional().nullable(),
  pages: z.string().max(50).optional().nullable(),
  publisher: z.string().max(300).optional().nullable(),
  publishedAt: z.string().optional().nullable(),

  // ISI / Scopus
  isISI: z.boolean().default(false),
  isScopus: z.boolean().default(false),
  scopusQ: z.string().max(10).optional().nullable(),
  impactFactor: z.number().min(0, 'Impact Factor không âm').optional().nullable(),
  ranking: z.string().max(50).optional().nullable(),
  citationCount: z.number().int().min(0, 'Số trích dẫn không âm').default(0),

  // Hội nghị / hội thảo (BAO_CAO_KH)
  conferenceName: z.string().max(500).optional().nullable(),
  proceedingName: z.string().max(500).optional().nullable(),

  // Bằng sáng chế (PATENT)
  patentNumber: z.string().max(100).optional().nullable(),
  patentGrantDate: z.string().optional().nullable(),

  // Sáng kiến (SANG_KIEN)
  decisionNumber: z.string().max(100).optional().nullable(),

  // Luận văn / luận án (LUAN_VAN, LUAN_AN)
  advisorName: z.string().max(300).optional().nullable(),
  defenseScore: z.number().min(0).max(10, 'Điểm bảo vệ trong khoảng 0–10').optional().nullable(),
  storageLocation: z.string().max(500).optional().nullable(),

  // Liên kết
  fullTextUrl: z.string().url('URL toàn văn không hợp lệ').max(1000).optional().nullable(),
  projectId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),

  // Danh sách tác giả chuẩn hóa (optional – nếu cần chi tiết hơn authorsText)
  publicationAuthors: z.array(publicationAuthorSchema).optional(),
})

export const nckhPublicationUpdateSchema = nckhPublicationCreateSchema.partial()

export type NckhPublicationCreateInput = z.infer<typeof nckhPublicationCreateSchema>
export type NckhPublicationUpdateInput = z.infer<typeof nckhPublicationUpdateSchema>
export type PublicationAuthorInput = z.infer<typeof publicationAuthorSchema>
