import { z } from 'zod';

const PartyFeeStatus = z.enum(['UNPAID', 'PARTIAL', 'PAID']);

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

export const partyFeeListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  paymentYear: z.coerce.number().int().min(2000).max(2100).optional(),
  status: PartyFeeStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyFeeCreateSchema = z.object({
  partyMemberId: z.string().trim().min(1, 'partyMemberId là bắt buộc'),
  paymentMonth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, 'paymentMonth phải có định dạng YYYY-MM'),
  expectedAmount: z.coerce.number().min(0, 'Số tiền dự kiến không được âm'),
  actualAmount: z.coerce.number().min(0, 'Số tiền thực nộp không được âm').default(0),
  paymentDate: optionalNullableDate,
  note: z.string().trim().optional().nullable(),
});

export const partyFeeUpdateSchema = partyFeeCreateSchema
  .omit({ partyMemberId: true })
  .partial();

export const partyFeeAutoGenerateSchema = z.object({
  paymentMonth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, 'paymentMonth phải có định dạng YYYY-MM'),
  defaultExpectedAmount: z.coerce.number().min(0, 'Số tiền mặc định không được âm').default(30000),
  organizationId: z.string().trim().optional(),
});

export type PartyFeeListFiltersInput = z.infer<typeof partyFeeListFiltersSchema>;
export type PartyFeeCreateInput = z.infer<typeof partyFeeCreateSchema>;
export type PartyFeeUpdateInput = z.infer<typeof partyFeeUpdateSchema>;
export type PartyFeeAutoGenerateInput = z.infer<typeof partyFeeAutoGenerateSchema>;
