/**
 * Career Validation Schemas – M02 Phase 2
 * Lookup fields (rank, position, unit) stay as free strings here;
 * they reference M19 items validated at UI level.
 */
import { z } from 'zod'
import { CareerEventType } from '@prisma/client'

// ─── Create ───────────────────────────────────────────────────────────────────

export const careerCreateSchema = z
  .object({
    eventType: z.nativeEnum(CareerEventType),
    /** Ngày sự kiện được ghi nhận */
    eventDate: z.string().datetime({ message: 'eventDate phải là ISO datetime' }),
    /** Ngày hiệu lực quyết định */
    effectiveDate: z.string().datetime().optional().nullable(),
    /** Ngày kết thúc – bắt buộc với STUDY_LEAVE / SECONDMENT nếu đã kết thúc */
    endDate: z.string().datetime().optional().nullable(),
    reason: z.string().max(1000).optional().nullable(),
    title: z.string().min(1, 'Tên sự kiện bắt buộc').max(500),
    decisionAuthority: z.string().max(300).optional().nullable(),
    oldPosition: z.string().max(300).optional().nullable(),
    newPosition: z.string().max(300).optional().nullable(),
    oldRank: z.string().max(200).optional().nullable(),
    newRank: z.string().max(200).optional().nullable(),
    oldUnit: z.string().max(300).optional().nullable(),
    newUnit: z.string().max(300).optional().nullable(),
    trainingName: z.string().max(500).optional().nullable(),
    trainingInstitution: z.string().max(300).optional().nullable(),
    trainingResult: z.string().max(200).optional().nullable(),
    certificateNumber: z.string().max(100).optional().nullable(),
    decisionNumber: z.string().max(100).optional().nullable(),
    decisionDate: z.string().datetime().optional().nullable(),
    signerName: z.string().max(200).optional().nullable(),
    signerPosition: z.string().max(300).optional().nullable(),
    /** MinIO key or signed URL */
    attachmentUrl: z.string().max(1000).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => {
      if (!d.effectiveDate || !d.endDate) return true
      return new Date(d.endDate) >= new Date(d.effectiveDate)
    },
    { message: 'endDate phải sau effectiveDate', path: ['endDate'] },
  )

// ─── Update ───────────────────────────────────────────────────────────────────

/** Base object without refine so we can derive update schema from it */
const careerBaseObject = z.object({
  eventType: z.nativeEnum(CareerEventType),
  eventDate: z.string().datetime({ message: 'eventDate phải là ISO datetime' }),
  effectiveDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  title: z.string().min(1, 'Tên sự kiện bắt buộc').max(500),
  decisionAuthority: z.string().max(300).optional().nullable(),
  oldPosition: z.string().max(300).optional().nullable(),
  newPosition: z.string().max(300).optional().nullable(),
  oldRank: z.string().max(200).optional().nullable(),
  newRank: z.string().max(200).optional().nullable(),
  oldUnit: z.string().max(300).optional().nullable(),
  newUnit: z.string().max(300).optional().nullable(),
  trainingName: z.string().max(500).optional().nullable(),
  trainingInstitution: z.string().max(300).optional().nullable(),
  trainingResult: z.string().max(200).optional().nullable(),
  certificateNumber: z.string().max(100).optional().nullable(),
  decisionNumber: z.string().max(100).optional().nullable(),
  decisionDate: z.string().datetime().optional().nullable(),
  signerName: z.string().max(200).optional().nullable(),
  signerPosition: z.string().max(300).optional().nullable(),
  attachmentUrl: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const careerUpdateSchema = careerBaseObject.partial().refine(
  (d) => {
    if (!d.effectiveDate || !d.endDate) return true
    return new Date(d.endDate) >= new Date(d.effectiveDate)
  },
  { message: 'endDate phải sau effectiveDate', path: ['endDate'] },
)

// ─── Soft-delete request ──────────────────────────────────────────────────────

export const careerDeleteSchema = z.object({
  deletionReason: z.string().max(500).optional(),
})

export type CareerCreateInput = z.infer<typeof careerCreateSchema>
export type CareerUpdateInput = z.infer<typeof careerUpdateSchema>
export type CareerDeleteInput = z.infer<typeof careerDeleteSchema>
