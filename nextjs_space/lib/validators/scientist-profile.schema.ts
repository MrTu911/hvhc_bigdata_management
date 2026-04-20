/**
 * Zod validators – UC-47 Scientist Profile
 */
import { z } from 'zod'

// ─── Update (self or admin) ───────────────────────────────────────────────────

export const scientistProfileUpdateSchema = z.object({
  // Thông tin học thuật (tự nhập hoặc sync từ FacultyProfile)
  academicRank:       z.string().max(100).nullable().optional(),
  degree:             z.string().max(100).nullable().optional(),
  specialization:     z.string().max(200).nullable().optional(),

  // Lĩnh vực và từ khóa
  researchFields:     z.array(z.string().max(100)).optional(),
  researchKeywords:   z.array(z.string().max(100)).optional(),

  // Chỉ số khoa học (manual entry – chờ UC-48 automation)
  hIndex:             z.number().int().min(0).optional(),
  i10Index:           z.number().int().min(0).optional(),
  totalCitations:     z.number().int().min(0).optional(),

  // Định danh ngoài
  orcidId:            z.string().max(50).optional().nullable(),
  scopusAuthorId:     z.string().max(50).optional().nullable(),
  googleScholarId:    z.string().max(100).optional().nullable(),

  // Thành tích (text snapshot)
  awards:             z.array(z.string().max(500)).optional(),

  // Mô tả
  bio:                z.string().max(2000).optional().nullable(),
})

export type ScientistProfileUpdateInput = z.infer<typeof scientistProfileUpdateSchema>
