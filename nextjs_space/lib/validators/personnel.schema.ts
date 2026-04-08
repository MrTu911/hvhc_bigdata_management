/**
 * Personnel Validation Schemas – M02 Phase 2
 */
import { z } from 'zod'
import { PersonnelCategory, PersonnelStatus, ManagingOrgan, BloodType } from '@prisma/client'

export const personnelCreateSchema = z.object({
  personnelCode: z.string().min(1, 'Mã cán bộ bắt buộc').max(50),
  fullName: z.string().min(1, 'Họ tên bắt buộc').max(200),
  fullNameEn: z.string().max(200).optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  bloodType: z.nativeEnum(BloodType).optional().nullable(),
  placeOfOrigin: z.string().max(500).optional().nullable(),
  birthPlace: z.string().max(500).optional().nullable(),
  permanentAddress: z.string().max(500).optional().nullable(),
  temporaryAddress: z.string().max(500).optional().nullable(),
  ethnicity: z.string().max(100).optional().nullable(),
  religion: z.string().max(100).optional().nullable(),
  category: z.nativeEnum(PersonnelCategory),
  managingOrgan: z.nativeEnum(ManagingOrgan),
  unitId: z.string().optional().nullable(),
  militaryIdNumber: z.string().max(50).optional().nullable(),
  militaryRank: z.string().max(100).optional().nullable(),
  rankDate: z.string().datetime().optional().nullable(),
  position: z.string().max(200).optional().nullable(),
  positionDate: z.string().datetime().optional().nullable(),
  enlistmentDate: z.string().datetime().optional().nullable(),
  educationLevel: z.string().max(100).optional().nullable(),
  specialization: z.string().max(200).optional().nullable(),
  politicalTheory: z.string().max(200).optional().nullable(),
  academicTitle: z.string().max(200).optional().nullable(),
  academicDegree: z.string().max(200).optional().nullable(),
  status: z.nativeEnum(PersonnelStatus).optional().default('DANG_CONG_TAC'),
})

export const personnelUpdateSchema = personnelCreateSchema
  .omit({ personnelCode: true })
  .partial()

export type PersonnelCreateInput = z.infer<typeof personnelCreateSchema>
export type PersonnelUpdateInput = z.infer<typeof personnelUpdateSchema>
