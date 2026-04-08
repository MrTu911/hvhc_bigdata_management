import { PartyOrgLevel } from '@prisma/client';
import { z } from 'zod';

export const partyOrgListFiltersSchema = z.object({
  search: z.string().trim().optional(),
  orgLevel: z.nativeEnum(PartyOrgLevel).optional(),
  parentId: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const partyOrgCreateSchema = z.object({
  code: z.string().trim().min(1, 'Mã tổ chức Đảng là bắt buộc'),
  name: z.string().trim().min(1, 'Tên tổ chức Đảng là bắt buộc'),
  shortName: z.string().trim().optional().nullable(),
  orgLevel: z.nativeEnum(PartyOrgLevel),
  parentId: z.string().trim().optional().nullable(),
  linkedUnitId: z.string().trim().optional().nullable(),
  unitId: z.string().trim().optional().nullable(),
  secretaryUserId: z.string().trim().optional().nullable(),
  deputySecretaryUserId: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  establishedDate: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v instanceof Date) return v;
      return new Date(v as string);
    },
    z.date().optional().nullable(),
  ),
});

export const partyOrgUpdateSchema = partyOrgCreateSchema
  .omit({ code: true })
  .partial();

export type PartyOrgListFiltersInput = z.infer<typeof partyOrgListFiltersSchema>;
export type PartyOrgCreateInput = z.infer<typeof partyOrgCreateSchema>;
export type PartyOrgUpdateInput = z.infer<typeof partyOrgUpdateSchema>;
