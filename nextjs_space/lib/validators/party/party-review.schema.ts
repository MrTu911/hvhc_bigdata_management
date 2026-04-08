import { ReviewGrade } from '@prisma/client';
import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

export const partyReviewListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  reviewYear: z.coerce.number().int().min(2000).max(2100).optional(),
  grade: z.nativeEnum(ReviewGrade).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyReviewCreateSchema = z.object({
  partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
  reviewYear: z.coerce
    .number()
    .int()
    .min(2000, 'Năm kiểm điểm không hợp lệ')
    .max(2100, 'Năm kiểm điểm không hợp lệ'),
  grade: z.nativeEnum(ReviewGrade),
  comments: z.string().trim().optional().nullable(),
  approvedBy: z.string().trim().optional().nullable(),
  approvedAt: optionalNullableDate,
  evidenceUrl: z.string().trim().url('URL minh chứng không hợp lệ').optional().nullable(),
});

export const partyReviewUpdateSchema = partyReviewCreateSchema
  .omit({ partyMemberId: true, reviewYear: true })
  .partial();

export type PartyReviewListFiltersInput = z.infer<typeof partyReviewListFiltersSchema>;
export type PartyReviewCreateInput = z.infer<typeof partyReviewCreateSchema>;
export type PartyReviewUpdateInput = z.infer<typeof partyReviewUpdateSchema>;
