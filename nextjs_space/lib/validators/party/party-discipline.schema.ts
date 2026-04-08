import { DisciplineSeverity } from '@prisma/client';
import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

export const partyDisciplineListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  severity: z.nativeEnum(DisciplineSeverity).optional(),
  dateFrom: optionalNullableDate,
  dateTo: optionalNullableDate,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyDisciplineCreateSchema = z.object({
  partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
  severity: z.nativeEnum(DisciplineSeverity),
  decisionNo: z.string().trim().optional().nullable(),
  decisionDate: optionalNullableDate,
  expiryDate: optionalNullableDate,
  issuer: z.string().trim().optional().nullable(),
  reason: z.string().trim().optional().nullable(),
  attachmentUrl: z.string().trim().url('URL đính kèm không hợp lệ').optional().nullable(),
});

export const partyDisciplineUpdateSchema = partyDisciplineCreateSchema
  .omit({ partyMemberId: true })
  .partial();

export type PartyDisciplineListFiltersInput = z.infer<typeof partyDisciplineListFiltersSchema>;
export type PartyDisciplineCreateInput = z.infer<typeof partyDisciplineCreateSchema>;
export type PartyDisciplineUpdateInput = z.infer<typeof partyDisciplineUpdateSchema>;
