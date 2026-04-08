import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

export const partyAwardListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  dateFrom: optionalNullableDate,
  dateTo: optionalNullableDate,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyAwardCreateSchema = z.object({
  partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
  title: z.string().trim().min(1, 'Tiêu đề khen thưởng là bắt buộc'),
  decisionNo: z.string().trim().optional().nullable(),
  decisionDate: optionalNullableDate,
  issuer: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  attachmentUrl: z.string().trim().url('URL đính kèm không hợp lệ').optional().nullable(),
});

export const partyAwardUpdateSchema = partyAwardCreateSchema
  .omit({ partyMemberId: true })
  .partial();

export type PartyAwardListFiltersInput = z.infer<typeof partyAwardListFiltersSchema>;
export type PartyAwardCreateInput = z.infer<typeof partyAwardCreateSchema>;
export type PartyAwardUpdateInput = z.infer<typeof partyAwardUpdateSchema>;
