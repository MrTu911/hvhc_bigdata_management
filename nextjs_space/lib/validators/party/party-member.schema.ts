import { PartyMemberStatus } from '@prisma/client';
import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (value instanceof Date) return value;
    return new Date(value as string);
  },
  z.date().optional().nullable(),
);

export const partyMemberListFiltersSchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(PartyMemberStatus).optional(),
  organizationId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyMemberCreateSchema = z.object({
  userId: z.string().trim().min(1, 'userId là bắt buộc'),
  organizationId: z.string().trim().optional().nullable(),
  partyOrgId: z.string().trim().optional().nullable(),
  partyCardNumber: z.string().trim().optional().nullable(),
  partyCardNo: z.string().trim().optional().nullable(),
  partyRole: z.string().trim().optional().nullable(),
  joinDate: optionalNullableDate,
  officialDate: optionalNullableDate,
  recommender1: z.string().trim().optional().nullable(),
  recommender2: z.string().trim().optional().nullable(),
  introducer1: z.string().trim().optional().nullable(),
  introducer2: z.string().trim().optional().nullable(),
  currentReviewGrade: z.string().trim().optional().nullable(),
  currentDebtAmount: z.coerce.number().optional().nullable(),
  confidentialNote: z.string().trim().optional().nullable(),
  status: z.nativeEnum(PartyMemberStatus).optional(),
});

export const partyMemberUpdateSchema = partyMemberCreateSchema
  .omit({ userId: true })
  .extend({
    statusChangeReason: z.string().trim().optional().nullable(),
    updatedBy: z.string().optional().nullable(),
  })
  .partial();

export type PartyMemberListFiltersInput = z.infer<typeof partyMemberListFiltersSchema>;
export type PartyMemberCreateInput = z.infer<typeof partyMemberCreateSchema>;
export type PartyMemberUpdateInput = z.infer<typeof partyMemberUpdateSchema>;
