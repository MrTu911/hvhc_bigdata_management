/**
 * Family Validation Schemas – M02 Phase 2
 * citizenId / phoneNumber are sensitive fields – write is allowed only to
 * callers with VIEW_SENSITIVE (enforced at service layer, not here).
 */
import { z } from 'zod'
import { FamilyRelationType } from '@prisma/client'

// ─── Create ───────────────────────────────────────────────────────────────────

export const familyCreateSchema = z.object({
  relation: z.nativeEnum(FamilyRelationType),
  fullName: z.string().min(1, 'Họ tên thành viên bắt buộc').max(300),
  dateOfBirth: z.string().datetime().optional().nullable(),
  /** Sensitive – CCCD/CMND */
  citizenId: z.string().max(20).optional().nullable(),
  /** Sensitive */
  phoneNumber: z.string().max(20).optional().nullable(),
  occupation: z.string().max(300).optional().nullable(),
  workplace: z.string().max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  isDeceased: z.boolean().optional().default(false),
  deceasedDate: z.string().datetime().optional().nullable(),
  dependentFlag: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
})

// ─── Update ───────────────────────────────────────────────────────────────────

export const familyUpdateSchema = familyCreateSchema.partial()

// ─── Soft-delete request ──────────────────────────────────────────────────────

export const familyDeleteSchema = z.object({
  deletedBy: z.string().min(1).optional(),
})

export type FamilyCreateInput = z.infer<typeof familyCreateSchema>
export type FamilyUpdateInput = z.infer<typeof familyUpdateSchema>
