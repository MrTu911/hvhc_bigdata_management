import { InspectionType } from '@prisma/client';
import { z } from 'zod';

const optionalNullableDate = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    return new Date(v as string);
  },
  z.date().optional().nullable(),
);

const requiredDate = z.preprocess(
  (v) => {
    if (v instanceof Date) return v;
    if (typeof v === 'string' && v.trim() !== '') return new Date(v);
    return undefined;
  },
  z.date({ required_error: 'Ngày mở kiểm tra là bắt buộc' }),
);

export const partyInspectionListFiltersSchema = z.object({
  partyMemberId: z.string().trim().optional(),
  partyOrgId: z.string().trim().optional(),
  inspectionType: z.nativeEnum(InspectionType).optional(),
  isClosed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyInspectionCreateSchema = z
  .object({
    partyMemberId: z.string().trim().optional().nullable(),
    partyOrgId: z.string().trim().optional().nullable(),
    inspectionType: z.nativeEnum(InspectionType),
    title: z.string().trim().min(1, 'Tiêu đề kiểm tra là bắt buộc'),
    openedAt: requiredDate,
    closedAt: optionalNullableDate,
    findings: z.string().trim().optional().nullable(),
    recommendation: z.string().trim().optional().nullable(),
    decisionRef: z.string().trim().optional().nullable(),
    attachmentUrl: z.string().trim().url('URL đính kèm không hợp lệ').optional().nullable(),
  })
  .refine(
    (data) =>
      (data.partyMemberId !== null && data.partyMemberId !== undefined && data.partyMemberId.trim() !== '') ||
      (data.partyOrgId !== null && data.partyOrgId !== undefined && data.partyOrgId.trim() !== ''),
    {
      message: 'Phải cung cấp ít nhất một trong hai: partyMemberId hoặc partyOrgId',
      path: ['partyMemberId'],
    },
  );

export const partyInspectionUpdateSchema = partyInspectionCreateSchema
  .innerType()
  .partial();

export type PartyInspectionListFiltersInput = z.infer<typeof partyInspectionListFiltersSchema>;
export type PartyInspectionCreateInput = z.infer<typeof partyInspectionCreateSchema>;
export type PartyInspectionUpdateInput = z.infer<typeof partyInspectionUpdateSchema>;
