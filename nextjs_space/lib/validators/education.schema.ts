/**
 * Education Validation Schemas – M02 Phase 2
 *
 * Lookup fields referencing M19 categories:
 *   institution  → MD_INSTITUTION
 *   major        → MD_MAJOR
 *   studyMode    → MD_STUDY_MODE
 *
 * Values are kept as free strings validated for length only;
 * UI should populate from MasterDataItem lookups.
 */
import { z } from 'zod'
import { EducationLevel } from '@prisma/client'

// ─── Create ───────────────────────────────────────────────────────────────────

export const educationCreateSchema = z
  .object({
    level: z.nativeEnum(EducationLevel),
    institution: z.string().min(1, 'Cơ sở đào tạo bắt buộc').max(500),
    /** Lookup MD_STUDY_MODE – tập trung / tại chức / từ xa */
    studyMode: z.string().max(200).optional().nullable(),
    /** Lookup MD_MAJOR */
    major: z.string().max(300).optional().nullable(),
    trainingSystem: z.string().max(200).optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    gpa: z.number().min(0).max(4).optional().nullable(),
    thesisTitle: z.string().max(500).optional().nullable(),
    supervisor: z.string().max(300).optional().nullable(),
    certificateCode: z.string().max(100).optional().nullable(),
    certificateDate: z.string().datetime().optional().nullable(),
    defenseDate: z.string().datetime().optional().nullable(),
    defenseLocation: z.string().max(300).optional().nullable(),
    examSubject: z.string().max(300).optional().nullable(),
    /** Xếp loại: Xuất sắc / Giỏi / Khá / Trung bình / Yếu */
    classification: z.string().max(100).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => {
      if (!d.startDate || !d.endDate) return true
      return new Date(d.endDate) >= new Date(d.startDate)
    },
    { message: 'endDate (năm kết thúc) phải sau hoặc bằng startDate', path: ['endDate'] },
  )
  .refine(
    (d) => {
      if (d.gpa === null || d.gpa === undefined) return true
      return d.gpa >= 0 && d.gpa <= 4
    },
    { message: 'GPA phải nằm trong khoảng 0–4', path: ['gpa'] },
  )

// ─── Update ───────────────────────────────────────────────────────────────────

/** Base object without refines so partial() is available */
const educationBaseObject = z.object({
  level: z.nativeEnum(EducationLevel),
  institution: z.string().min(1, 'Cơ sở đào tạo bắt buộc').max(500),
  studyMode: z.string().max(200).optional().nullable(),
  major: z.string().max(300).optional().nullable(),
  trainingSystem: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  gpa: z.number().min(0).max(4).optional().nullable(),
  thesisTitle: z.string().max(500).optional().nullable(),
  supervisor: z.string().max(300).optional().nullable(),
  certificateCode: z.string().max(100).optional().nullable(),
  certificateDate: z.string().datetime().optional().nullable(),
  defenseDate: z.string().datetime().optional().nullable(),
  defenseLocation: z.string().max(300).optional().nullable(),
  examSubject: z.string().max(300).optional().nullable(),
  classification: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const educationUpdateSchema = educationBaseObject.partial().refine(
  (d) => {
    if (!d.startDate || !d.endDate) return true
    return new Date(d.endDate) >= new Date(d.startDate)
  },
  { message: 'endDate phải sau hoặc bằng startDate', path: ['endDate'] },
)

export type EducationCreateInput = z.infer<typeof educationCreateSchema>
export type EducationUpdateInput = z.infer<typeof educationUpdateSchema>
